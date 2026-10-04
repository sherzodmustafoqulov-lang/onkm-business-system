import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { checkPermission } from '@/lib/rbac';
import { notifyCustomerTicketUpdate } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

// GET /api/tickets/[id]: Returns single ticket + Full 360° Context (Customer, Devices, Previous Tickets, Installations)
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
    }

    const { id } = params;

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        customer: true,
        branch: true,
        assignedTo: {
          select: { id: true, name: true, email: true, phone: true },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Chipta topilmadi' }, { status: 404 });
    }

    // Resolve assigned technician if any
    let technician = null;
    if (ticket.technicianId) {
      technician = await prisma.user.findUnique({
        where: { id: ticket.technicianId },
        select: { id: true, name: true, phone: true, email: true },
      });
    }

    // 1. Customer Devices History
    const [terminals, posSystems, fiscalModules, serials] = await Promise.all([
      prisma.customerTerminal.findMany({
        where: { customerId: ticket.customerId },
      }),
      prisma.customerPOS.findMany({
        where: { customerId: ticket.customerId },
      }),
      prisma.fiscalModule.findMany({
        where: { customerId: ticket.customerId },
      }),
      prisma.productSerial.findMany({
        where: { customerId: ticket.customerId },
        include: { product: true },
      }),
    ]);

    // 2. Previous Tickets for this customer
    const previousTickets = await prisma.supportTicket.findMany({
      where: {
        customerId: ticket.customerId,
        id: { not: ticket.id },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        ticketNumber: true,
        category: true,
        issue: true,
        status: true,
        solution: true,
        createdAt: true,
        closedAt: true,
      },
    });

    // 3. Installation History for this customer
    const installationHistory = await prisma.installation.findMany({
      where: { customerId: ticket.customerId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        technician: { select: { id: true, name: true, phone: true } },
      },
    });

    return NextResponse.json({
      ticket: {
        ...ticket,
        technician,
      },
      context360: {
        customer: ticket.customer,
        devices: {
          terminals,
          posSystems,
          fiscalModules,
          serials,
        },
        previousTickets,
        installationHistory,
      },
    });
  } catch (error: any) {
    console.error('GET /api/tickets/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/tickets/[id]: Update ticket status, technician, priority, solution, aiDiagnosis
export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const {
      status,
      priority,
      category,
      assignedToId,
      technicianId,
      solution,
      aiDiagnosis,
      deviceName,
      serialNumber,
    } = body;

    const existing = await prisma.supportTicket.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Chipta topilmadi' }, { status: 404 });
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (status !== undefined) {
      updateData.status = status;
      if (status === 'YECHILDI' || status === 'YOPILDI') {
        updateData.closedAt = new Date();
      }
    }
    if (priority !== undefined) updateData.priority = priority;
    if (category !== undefined) updateData.category = category;
    if (assignedToId !== undefined) updateData.assignedToId = assignedToId;
    if (technicianId !== undefined) updateData.technicianId = technicianId;
    if (solution !== undefined) updateData.solution = solution;
    if (aiDiagnosis !== undefined) updateData.aiDiagnosis = aiDiagnosis;
    if (deviceName !== undefined) updateData.deviceName = deviceName;
    if (serialNumber !== undefined) updateData.serialNumber = serialNumber;

    const updated = await prisma.supportTicket.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        assignedTo: true,
        branch: true,
      },
    });

    // If ticket status changed and customer has Telegram, notify customer
    if (status !== undefined && status !== existing.status && existing.customer.telegramChatId) {
      try {
        await notifyCustomerTicketUpdate(existing.customer.telegramChatId, updated, status, solution);
      } catch (err) {
        console.error('Telegram notification to customer error:', err);
      }
    }

    // If technician assigned, send notification
    if (technicianId && technicianId !== existing.technicianId) {
      await prisma.notification.create({
        data: {
          userId: technicianId,
          title: `Support Chiptasi Biriktirildi: ${existing.ticketNumber}`,
          message: `${existing.customer.companyName} bo'yicha texnik murojaat (${existing.category}): ${existing.issue}`,
          type: 'INFO',
          link: `/support?id=${id}`,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: 'UPDATE',
        entity: 'SupportTicket',
        entityId: id,
        oldValue: JSON.stringify({ status: existing.status, priority: existing.priority }),
        newValue: JSON.stringify(updateData),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Chipta ma\'lumotlari yangilandi',
      ticket: updated,
    });
  } catch (error: any) {
    console.error('PATCH /api/tickets/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
