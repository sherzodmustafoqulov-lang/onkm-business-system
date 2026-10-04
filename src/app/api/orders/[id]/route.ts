import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { checkPermission } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

// GET /api/orders/[id]: Get full single order details + available stock for each line item
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
    }

    if (!checkPermission(user.role, user.permissions, 'SALES', 'canView')) {
      return NextResponse.json({ error: 'Buyurtmani ko\'rish huquqi yo\'q' }, { status: 403 });
    }

    const { id } = params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: {
          include: {
            contacts: true,
            outlets: true,
          },
        },
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        branch: true,
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
        payments: {
          orderBy: { paidAt: 'desc' },
          include: {
            receivedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        installations: {
          include: {
            technician: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Buyurtma topilmadi' }, { status: 404 });
    }

    // RBAC branch isolation check
    if (user.role === 'MANAGER' && user.branchId && order.branchId !== user.branchId) {
      return NextResponse.json({ error: 'Boshqa filial buyurtmasini ko\'rish taqiqlangan' }, { status: 403 });
    }

    // Fetch live warehouse stock for each product in this branch
    const productIds = order.items.map((it) => it.productId);
    const stocks = await prisma.warehouseStock.findMany({
      where: {
        branchId: order.branchId,
        productId: { in: productIds },
      },
    });

    const stockMap = new Map(stocks.map((s) => [s.productId, s]));

    const enrichedItems = order.items.map((it) => {
      const st = stockMap.get(it.productId);
      return {
        ...it,
        warehouseStock: {
          quantity: st?.quantity || 0,
          reserved: st?.reserved || 0,
          available: Math.max(0, (st?.quantity || 0) - (st?.reserved || 0)),
        },
      };
    });

    return NextResponse.json({
      order: {
        ...order,
        items: enrichedItems,
      },
    });
  } catch (error: any) {
    console.error('GET /api/orders/[id] error:', error);
    return NextResponse.json({ error: 'Buyurtmani yuklashda xatolik: ' + error.message }, { status: 500 });
  }
}

// PATCH /api/orders/[id]: Update basic order properties
export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
    }

    if (!checkPermission(user.role, user.permissions, 'SALES', 'canEdit')) {
      return NextResponse.json({ error: 'Buyurtmani tahrirlash huquqi yo\'q' }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const { deliveryRequired, installationRequired, notes, managerId } = body;

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Buyurtma topilmadi' }, { status: 404 });
    }

    const updateData: any = {};
    if (deliveryRequired !== undefined) updateData.deliveryRequired = Boolean(deliveryRequired);
    if (installationRequired !== undefined) updateData.installationRequired = Boolean(installationRequired);
    if (notes !== undefined) updateData.notes = notes;
    if (managerId) updateData.managerId = managerId;
    if (body.pipelineStage !== undefined) updateData.pipelineStage = body.pipelineStage;
    if (body.status !== undefined) updateData.status = body.status;

    const updated = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        branch: true,
        manager: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: 'UPDATE',
        entity: 'Order',
        entityId: id,
        oldValue: JSON.stringify(existing),
        newValue: JSON.stringify(updated),
      },
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (error: any) {
    console.error('PATCH /api/orders/[id] error:', error);
    return NextResponse.json({ error: error.message || 'Tahrirlashda xatolik' }, { status: 500 });
  }
}
