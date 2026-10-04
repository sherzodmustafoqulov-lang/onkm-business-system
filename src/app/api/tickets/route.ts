import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { checkPermission } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

// GET /api/tickets: List support tickets with filters, search, and KPI metrics
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
    }

    if (!checkPermission(user.role, user.permissions, 'SUPPORT', 'canView')) {
      return NextResponse.json({ error: 'Support chiptalarini ko\'rish huquqi yo\'q' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q') || '';
    const statusFilter = searchParams.get('status');
    const categoryFilter = searchParams.get('category');
    const priorityFilter = searchParams.get('priority');
    const branchFilter = searchParams.get('branchId');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '25', 10));
    const skip = (page - 1) * limit;

    const where: any = {};

    // Branch isolation for branch managers
    if (user.role === 'MANAGER' && user.branchId) {
      where.branchId = user.branchId;
    } else if (branchFilter && branchFilter !== 'ALL') {
      where.branchId = branchFilter;
    }

    if (statusFilter && statusFilter !== 'ALL') {
      where.status = statusFilter;
    }

    if (categoryFilter && categoryFilter !== 'ALL') {
      where.category = categoryFilter;
    }

    if (priorityFilter && priorityFilter !== 'ALL') {
      where.priority = priorityFilter;
    }

    if (search.trim()) {
      const q = search.trim();
      where.OR = [
        { ticketNumber: { contains: q } },
        { customer: { companyName: { contains: q } } },
        { customer: { inn: { contains: q } } },
        { customer: { phone: { contains: q } } },
        { issue: { contains: q } },
        { deviceName: { contains: q } },
        { serialNumber: { contains: q } },
      ];
    }

    const [total, tickets, allTickets] = await Promise.all([
      prisma.supportTicket.count({ where }),
      prisma.supportTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
        include: {
          customer: {
            select: {
              id: true,
              companyName: true,
              inn: true,
              phone: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      prisma.supportTicket.findMany({
        where: user.role === 'MANAGER' && user.branchId ? { branchId: user.branchId } : {},
        select: { status: true, priority: true },
      }),
    ]);

    const kpis = {
      total: allTickets.length,
      yangi: allTickets.filter((t) => t.status === 'YANGI').length,
      jarayonda: allTickets.filter((t) => t.status === 'JARAYONDA').length,
      javobKutilmoqda: allTickets.filter((t) => t.status === 'JAVOB_KUTILMOQDA').length,
      texnikkaBerildi: allTickets.filter((t) => t.status === 'TEXNIKKA_BERILDI').length,
      yechildi: allTickets.filter((t) => t.status === 'YECHILDI' || t.status === 'YOPILDI').length,
      urgent: allTickets.filter((t) => t.priority === 'SHOSHILINCH' && t.status !== 'YOPILDI').length,
    };

    return NextResponse.json({
      tickets,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      kpis,
    });
  } catch (error: any) {
    console.error('GET /api/tickets error:', error);
    return NextResponse.json({ error: error.message || 'Chiptalarni yuklashda xatolik' }, { status: 500 });
  }
}

// POST /api/tickets: Create a new support ticket
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
    }

    if (!checkPermission(user.role, user.permissions, 'SUPPORT', 'canCreate')) {
      return NextResponse.json({ error: 'Chipta yaratish huquqi yo\'q' }, { status: 403 });
    }

    const body = await request.json();
    const {
      customerId,
      branchId: reqBranchId,
      deviceName,
      serialNumber,
      category = 'KKM',
      issue,
      priority = 'ODDIY',
      assignedToId,
      technicianId,
      initialMessage,
    } = body;

    if (!customerId) {
      return NextResponse.json({ error: 'Mijoz tanlanishi shart' }, { status: 400 });
    }

    if (!issue || !issue.trim()) {
      return NextResponse.json({ error: 'Muammo tavsifi kiritilishi shart' }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) {
      return NextResponse.json({ error: 'Mijoz topilmadi' }, { status: 404 });
    }

    const branchId = reqBranchId || customer.branchId || user.branchId;

    // Generate unique sequential ticket number: TCK-2025-0001
    const year = new Date().getFullYear();
    const count = await prisma.supportTicket.count();
    const ticketNumber = `TCK-${year}-${String(count + 1).padStart(4, '0')}`;

    const newTicket = await prisma.$transaction(async (tx) => {
      const ticket = await tx.supportTicket.create({
        data: {
          ticketNumber,
          customerId,
          branchId,
          deviceName: deviceName || 'Noma\'lum uskuna',
          serialNumber: serialNumber || null,
          category,
          issue,
          priority,
          status: 'YANGI',
          assignedToId: assignedToId || user.id,
          technicianId: technicianId || null,
          messages: {
            create: [
              {
                senderType: 'USER',
                senderId: user.id,
                senderName: user.name,
                message: initialMessage || issue,
              },
            ],
          },
        },
        include: {
          customer: true,
          branch: true,
          assignedTo: true,
          messages: true,
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          userName: user.name,
          action: 'CREATE',
          entity: 'SupportTicket',
          entityId: ticket.id,
          newValue: JSON.stringify({
            ticketNumber,
            customer: customer.companyName,
            category,
            issue,
            priority,
          }),
        },
      });

      return ticket;
    });

    return NextResponse.json({
      success: true,
      message: `Chipta yaratildi: ${newTicket.ticketNumber}`,
      ticket: newTicket,
    }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/tickets error:', error);
    return NextResponse.json({ error: error.message || 'Chipta yaratishda xatolik' }, { status: 400 });
  }
}
