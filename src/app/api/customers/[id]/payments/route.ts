import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
    }

    const customerId = params.id;
    const body = await request.json();

    const {
      amount,
      method = 'NAQD', // NAQD, BANK, ELEKTRON (CLICK, PAYME, HUMO, UZCARD)
      paymentNumber,
      paidAt,
      notes,
    } = body;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'To\'lov summasi to\'g\'ri kiritilishi shart' }, { status: 400 });
    }

    // Auto-generate payment receipt number if not provided
    const receiptNumber = paymentNumber?.trim() || `KVT-${Date.now().toString().slice(-6)}`;

    // Create payment in database
    const payment = await prisma.payment.create({
      data: {
        customerId,
        paymentNumber: receiptNumber,
        amount: parsedAmount,
        method: method || 'NAQD',
        status: 'TO\'LIQ_TO\'LANGAN',
        receivedById: user.id,
        paidAt: paidAt ? new Date(paidAt) : new Date(),
        notes: notes ? notes.trim() : null,
      },
    });

    // Update customer debt & balance
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (customer) {
      const currentDebt = customer.debt || 0;
      const currentBalance = customer.balance || 0;
      if (parsedAmount <= currentDebt) {
        await prisma.customer.update({
          where: { id: customerId },
          data: { debt: currentDebt - parsedAmount },
        });
      } else {
        const excess = parsedAmount - currentDebt;
        await prisma.customer.update({
          where: { id: customerId },
          data: { debt: 0, balance: currentBalance + excess },
        });
      }
    }

    // Write audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          userName: user.name,
          action: 'CREATE_PAYMENT',
          entity: 'Customer',
          entityId: customerId,
          newValue: `To'lov qabul qilindi: ${new Intl.NumberFormat('uz-UZ').format(parsedAmount)} so'm (${method}, ${receiptNumber})`,
        },
      });
    } catch (e) {}

    return NextResponse.json({
      success: true,
      payment,
      message: 'To\'lov muvaffaqiyatli qabul qilindi va hisoblandi',
    });
  } catch (error: any) {
    console.error('Create payment error:', error);
    return NextResponse.json(
      { error: error.message || 'To\'lovni qabul qilishda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}
