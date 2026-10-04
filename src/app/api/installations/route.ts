import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { checkPermission } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

// GET /api/installations: List installation tasks with filters, search, technician isolation, and KPIs
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
    }

    if (!checkPermission(user.role, user.permissions, 'INSTALLATIONS', 'canView')) {
      return NextResponse.json({ error: 'O\'rnatishlar ro\'yxatini ko\'rish huquqi yo\'q' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q') || '';
    const statusFilter = searchParams.get('status');
    const branchFilter = searchParams.get('branchId');
    const technicianFilter = searchParams.get('technicianId');
    const serviceFilter = searchParams.get('serviceType');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '25', 10));
    const skip = (page - 1) * limit;

    const where: any = {};

    // If logged-in user is a technician, restrict to their tasks unless admin
    if (user.role === 'TECHNICIAN') {
      where.technicianId = user.id;
    } else if (technicianFilter && technicianFilter !== 'ALL') {
      where.technicianId = technicianFilter;
    }

    // Branch isolation
    if (user.role === 'MANAGER' && user.branchId) {
      where.branchId = user.branchId;
    } else if (branchFilter && branchFilter !== 'ALL') {
      where.branchId = branchFilter;
    }

    if (statusFilter && statusFilter !== 'ALL') {
      where.status = statusFilter;
    }

    if (serviceFilter && serviceFilter !== 'ALL') {
      where.serviceType = serviceFilter;
    }

    if (search.trim()) {
      const q = search.trim();
      where.OR = [
        { taskNumber: { contains: q } },
        { customer: { companyName: { contains: q } } },
        { customer: { inn: { contains: q } } },
        { customer: { phone: { contains: q } } },
        { deviceName: { contains: q } },
        { serialNumber: { contains: q } },
        { location: { contains: q } },
      ];
    }

    const [total, installations, allTasks] = await Promise.all([
      prisma.installation.count({ where }),
      prisma.installation.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ scheduledDate: 'desc' }, { createdAt: 'desc' }],
        include: {
          customer: {
            select: {
              id: true,
              companyName: true,
              inn: true,
              phone: true,
              address: true,
              contacts: true,
            },
          },
          technician: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          manager: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          order: {
            select: {
              id: true,
              orderNumber: true,
              finalAmount: true,
              status: true,
            },
          },
        },
      }),
      prisma.installation.findMany({
        where: user.role === 'TECHNICIAN' ? { technicianId: user.id } : {},
        select: { status: true, technicianId: true },
      }),
    ]);

    const kpis = {
      total: allTasks.length,
      yangi: allTasks.filter((t) => t.status === 'YANGI').length,
      jarayonda: allTasks.filter((t) =>
        ['QABUL_QILINDI', 'YOLDA', 'ISH_BOSHLANDI', 'ORNATILDI', 'TEST_QILINDI'].includes(t.status)
      ).length,
      yakunlandi: allTasks.filter((t) => t.status === 'YAKUNLANDI').length,
      myTasks: user.role === 'TECHNICIAN' ? allTasks.length : allTasks.filter((t) => t.technicianId === user.id).length,
    };

    return NextResponse.json({
      installations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      kpis,
    });
  } catch (error: any) {
    console.error('GET /api/installations error:', error);
    return NextResponse.json({ error: error.message || 'Xatolik yuz berdi' }, { status: 500 });
  }
}

// POST /api/installations: Create installation task (standalone or from Order)
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
    }

    if (!checkPermission(user.role, user.permissions, 'INSTALLATIONS', 'canCreate')) {
      return NextResponse.json({ error: 'O\'rnatish vazifasini yaratish huquqi yo\'q' }, { status: 403 });
    }

    const body = await request.json();
    const {
      customerId,
      orderId,
      branchId: reqBranchId,
      technicianId,
      managerId: reqManagerId,
      serviceType = 'ONKM_ORNATISH',
      deviceName,
      serialNumber,
      location,
      scheduledDate,
      scheduledTime,
      notes = '',
    } = body;

    if (!customerId) {
      return NextResponse.json({ error: 'Mijoz tanlanishi shart' }, { status: 400 });
    }

    if (!deviceName) {
      return NextResponse.json({ error: 'Qurilma / Uskuna nomi kiritilishi shart' }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) {
      return NextResponse.json({ error: 'Mijoz topilmadi' }, { status: 404 });
    }

    const branchId = reqBranchId || customer.branchId || user.branchId;
    const managerId = reqManagerId || user.id;

    // Sequential task number
    const year = new Date().getFullYear();
    const count = await prisma.installation.count();
    const taskNumber = `TASK-${year}-${String(count + 1).padStart(4, '0')}`;

    const taskLocation = location || customer.address || 'Manzil ko\'rsatilmagan';

    const result = await prisma.$transaction(async (tx) => {
      const task = await tx.installation.create({
        data: {
          taskNumber,
          customerId,
          orderId: orderId || null,
          branchId,
          technicianId: technicianId || null,
          managerId,
          serviceType,
          deviceName,
          serialNumber: serialNumber || null,
          location: taskLocation,
          scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
          scheduledTime: scheduledTime || null,
          status: 'YANGI',
          notes,
        },
        include: {
          customer: true,
          technician: true,
          manager: true,
          branch: true,
          order: true,
        },
      });

      // If linked to an order, update order status to ORNATILMOQDA
      if (orderId) {
        await tx.order.update({
          where: { id: orderId },
          data: {
            status: 'ORNATILMOQDA',
            pipelineStage: 'ORNATISH',
          },
        });
      }

      // If technician assigned, send notification to technician
      if (technicianId) {
        await tx.notification.create({
          data: {
            userId: technicianId,
            title: `Yangi O'rnatish Topshirig'i: ${taskNumber}`,
            message: `${customer.companyName} uchun ${deviceName} o'rnatish vazifasi biriktirildi. Manzil: ${taskLocation}`,
            type: 'INFO',
            link: `/installations?id=${task.id}`,
          },
        });
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          userName: user.name,
          action: 'CREATE',
          entity: 'Installation',
          entityId: task.id,
          newValue: JSON.stringify({
            taskNumber,
            customer: customer.companyName,
            deviceName,
            technicianId,
            location: taskLocation,
          }),
        },
      });

      return task;
    });

    return NextResponse.json({
      success: true,
      message: `O'rnatish topshirig'i yaratildi: ${result.taskNumber}`,
      installation: result,
    }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/installations error:', error);
    return NextResponse.json({ error: error.message || 'O\'rnatish vazifasini yaratishda xatolik' }, { status: 400 });
  }
}
