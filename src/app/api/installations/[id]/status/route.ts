import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { checkPermission } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

const STATUS_LABELS: Record<string, string> = {
  YANGI: 'Yangi',
  QABUL_QILINDI: 'Qabul qilindi',
  YOLDA: 'Yo\'lga chiqdi',
  ISH_BOSHLANDI: 'Ish boshlandi',
  ORNATILDI: 'Qurilma o\'rnatildi',
  TEST_QILINDI: 'Test qilindi',
  YAKUNLANDI: 'Yakunlandi',
  BEKOR_QILINDI: 'Bekor qilindi',
};

// POST /api/installations/[id]/status: Technician mobile workflow action & manager notifications
export async function POST(request: Request, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const {
      status,
      serialNumber,
      photoUrl,
      completionDoc,
      completionNotes,
      updateOrderStatus = true,
      note,
    } = body;

    if (!status || !STATUS_LABELS[status]) {
      return NextResponse.json({ error: 'Noto\'g\'ri status ko\'rsatildi' }, { status: 400 });
    }

    const task = await prisma.installation.findUnique({
      where: { id },
      include: {
        customer: true,
        manager: true,
        order: { include: { manager: true } },
        technician: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Topshiriq topilmadi' }, { status: 404 });
    }

    // Role check: Technician can update their assigned tasks, Admin & Manager can update any task
    if (user.role === 'TECHNICIAN' && task.technicianId && task.technicianId !== user.id) {
      return NextResponse.json({ error: 'Ushbu vazifa boshqa texnikka biriktirilgan' }, { status: 403 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updateData: any = {
        status,
        updatedAt: new Date(),
      };

      if (serialNumber) updateData.serialNumber = serialNumber;
      if (photoUrl) updateData.photoUrl = photoUrl;
      if (completionDoc) updateData.completionDoc = completionDoc;
      if (completionNotes) updateData.completionNotes = completionNotes;
      if (status === 'YAKUNLANDI') {
        updateData.completedAt = new Date();
      }
      if (note) {
        updateData.notes = task.notes
          ? `${task.notes}\n[${new Date().toLocaleDateString('uz')}] ${user.name}: ${note}`
          : note;
      }

      // 1. Update Installation record
      const updatedTask = await tx.installation.update({
        where: { id },
        data: updateData,
        include: {
          customer: true,
          technician: true,
          manager: true,
          order: true,
        },
      });

      // 2. If status is completed and updateOrderStatus is true, update the linked Order
      let orderUpdated = false;
      if (status === 'YAKUNLANDI' && updateOrderStatus && task.orderId) {
        await tx.order.update({
          where: { id: task.orderId },
          data: {
            status: 'YAKUNLANDI',
            pipelineStage: 'YAKUNLANDI',
          },
        });
        orderUpdated = true;
      }

      // 3. Send Notification to Manager
      // Manager is either task.managerId or order.managerId or an active admin/manager
      let targetManagerId = task.managerId || task.order?.managerId;
      if (!targetManagerId) {
        const fallbackManager = await tx.user.findFirst({
          where: { role: { name: { in: ['MANAGER', 'ADMIN'] } }, isActive: true },
        });
        targetManagerId = fallbackManager?.id;
      }

      if (targetManagerId) {
        const statusText = STATUS_LABELS[status];
        await tx.notification.create({
          data: {
            userId: targetManagerId,
            title: `O'rnatish holati: ${statusText} (${task.taskNumber})`,
            message: `Texnik ${user.name} topshiriqni "${statusText}" bosqichiga o'tkazdi. Mijoz: ${task.customer.companyName}, Qurilma: ${task.deviceName}`,
            type: status === 'YAKUNLANDI' ? 'SUCCESS' : 'INFO',
            link: `/installations?id=${task.id}`,
          },
        });
      }

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          userName: user.name,
          action: 'UPDATE',
          entity: 'InstallationStatus',
          entityId: id,
          oldValue: JSON.stringify({ status: task.status }),
          newValue: JSON.stringify({
            status,
            photoUploaded: Boolean(photoUrl),
            completionDoc: Boolean(completionDoc),
            orderUpdated,
          }),
        },
      });

      return { updatedTask, orderUpdated };
    });

    return NextResponse.json({
      success: true,
      message: `Topshiriq holati "${STATUS_LABELS[status]}" ga o'zgartirildi`,
      installation: result.updatedTask,
      orderUpdated: result.orderUpdated,
    });
  } catch (error: any) {
    console.error('POST /api/installations/[id]/status error:', error);
    return NextResponse.json({ error: error.message || 'Statusni yangilashda xatolik' }, { status: 400 });
  }
}
