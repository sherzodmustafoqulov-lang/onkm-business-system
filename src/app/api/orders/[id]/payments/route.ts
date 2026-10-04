import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { checkPermission } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

// GET /api/orders/[id]/payments: List all payments for a specific order
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
    }

    const { id } = params;

    const payments = await prisma.payment.findMany({
      where: { orderId: id },
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
    });

    return NextResponse.json({ payments });
  } catch (error: any) {
    console.error('GET /api/orders/[id]/payments error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/orders/[id]/payments: Record payment with customer debt reduction and ACID transaction
export async function POST(request: Request, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
    }

    const canPayFinance = checkPermission(user.role, user.permissions, 'FINANCE', 'canCreate');
    const canPaySales = checkPermission(user.role, user.permissions, 'SALES', 'canEdit');

    if (!canPayFinance && !canPaySales) {
      return NextResponse.json({ error: 'To\'lov qabul qilish huquqi yo\'q' }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const { amount, method = 'Naqd', notes = '' } = body;

    const payAmount = parseFloat(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      return NextResponse.json({ error: 'To\'lov summasi musbat son bo\'lishi shart' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Buyurtma topilmadi' }, { status: 404 });
    }

    if (order.debtAmount <= 0 && order.paymentStatus === 'TO\'LIQ_TO\'LANGAN') {
      return NextResponse.json({ error: 'Ushbu buyurtma bo\'yicha to\'lov to\'liq amalga oshirilgan' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Generate sequential payment number
      const year = new Date().getFullYear();
      const count = await tx.payment.count();
      const paymentNumber = `PAY-${year}-${String(count + 1).padStart(4, '0')}`;

      // 2. Create Payment record
      const payment = await tx.payment.create({
        data: {
          paymentNumber,
          orderId: order.id,
          customerId: order.customerId,
          amount: payAmount,
          method,
          status: 'TO\'LIQ_TO\'LANGAN',
          receivedById: user.id,
          notes: notes || `Buyurtma ${order.orderNumber} uchun to'lov`,
        },
        include: {
          receivedBy: {
            select: { id: true, name: true },
          },
        },
      });

      // 3. Update Order paid and debt totals
      const newPaidAmount = order.paidAmount + payAmount;
      const newDebtAmount = Math.max(0, order.finalAmount - newPaidAmount);
      const isFullyPaid = newPaidAmount >= order.finalAmount;
      const paymentStatus = isFullyPaid ? 'TO\'LIQ_TO\'LANGAN' : 'QISMAN_TO\'LANGAN';

      let newOrderStatus = order.status;
      if (order.status === 'TOLOV_KUTILMOQDA' || order.status === 'YANGI') {
        newOrderStatus = isFullyPaid ? 'TOLANGAN' : 'QISMAN_TOLANGAN';
      }

      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          paidAmount: newPaidAmount,
          debtAmount: newDebtAmount,
          paymentStatus,
          status: newOrderStatus,
        },
        include: {
          customer: true,
          payments: { orderBy: { paidAt: 'desc' } },
        },
      });

      // 4. Reduce customer debt
      await tx.customer.update({
        where: { id: order.customerId },
        data: {
          debt: { decrement: Math.min(order.customer.debt, payAmount) },
        },
      });

      // 5. Audit Log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          userName: user.name,
          action: 'CREATE',
          entity: 'Payment',
          entityId: payment.id,
          newValue: JSON.stringify({
            paymentNumber,
            orderNumber: order.orderNumber,
            amount: payAmount,
            method,
            newDebtAmount,
          }),
        },
      });

      return { payment, updatedOrder };
    });

    return NextResponse.json({
      success: true,
      message: `${payAmount.toLocaleString()} so'm to'lov qabul qilindi (${result.payment.paymentNumber})`,
      payment: result.payment,
      order: result.updatedOrder,
    }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/orders/[id]/payments error:', error);
    return NextResponse.json({ error: error.message || 'To\'lovni saqlashda xatolik yuz berdi' }, { status: 400 });
  }
}
