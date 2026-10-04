import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { checkPermission } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
    }

    const { id } = params;
    const task = await prisma.installation.findUnique({
      where: { id },
      include: {
        customer: {
          include: { contacts: true, outlets: true },
        },
        technician: true,
        manager: true,
        branch: true,
        order: {
          include: {
            items: { include: { product: true } },
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Topshiriq topilmadi' }, { status: 404 });
    }

    return NextResponse.json({ installation: task });
  } catch (error: any) {
    console.error('GET /api/installations/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
    }

    if (!checkPermission(user.role, user.permissions, 'INSTALLATIONS', 'canEdit')) {
      return NextResponse.json({ error: 'Tahrirlash huquqi yo\'q' }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const { technicianId, location, scheduledDate, scheduledTime, notes, serialNumber, deviceName, serviceType } = body;

    const existing = await prisma.installation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Topshiriq topilmadi' }, { status: 404 });
    }

    const updateData: any = {};
    if (technicianId !== undefined) updateData.technicianId = technicianId || null;
    if (location !== undefined) updateData.location = location;
    if (scheduledDate !== undefined) updateData.scheduledDate = scheduledDate ? new Date(scheduledDate) : null;
    if (scheduledTime !== undefined) updateData.scheduledTime = scheduledTime;
    if (notes !== undefined) updateData.notes = notes;
    if (serialNumber !== undefined) updateData.serialNumber = serialNumber;
    if (deviceName !== undefined) updateData.deviceName = deviceName;
    if (serviceType !== undefined) updateData.serviceType = serviceType;

    const updated = await prisma.installation.update({
      where: { id },
      data: updateData,
      include: { customer: true, technician: true },
    });

    // Notify technician if technician was newly assigned or changed
    if (technicianId && technicianId !== existing.technicianId) {
      await prisma.notification.create({
        data: {
          userId: technicianId,
          title: `O'rnatish Topshirig'i Biriktirildi: ${existing.taskNumber}`,
          message: `Sizga ${updated.customer.companyName} uchun topshiriq biriktirildi`,
          type: 'INFO',
          link: `/installations?id=${id}`,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: 'UPDATE',
        entity: 'Installation',
        entityId: id,
        oldValue: JSON.stringify(existing),
        newValue: JSON.stringify(updated),
      },
    });

    return NextResponse.json({ success: true, installation: updated });
  } catch (error: any) {
    console.error('PATCH /api/installations/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
