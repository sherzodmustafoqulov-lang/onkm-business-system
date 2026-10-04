import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { checkPermission } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
    }

    if (!checkPermission(user.role, user.permissions, 'FINANCE', 'canView')) {
      return NextResponse.json({ error: 'Moliya ma\'lumotlarini ko\'rish huquqi yo\'q' }, { status: 403 });
    }

    const [payments, orders, customersWithDebt] = await Promise.all([
      prisma.payment.findMany({
        orderBy: { paidAt: 'desc' },
        take: 100,
        include: {
          customer: { select: { id: true, companyName: true, inn: true } },
          order: { select: { id: true, orderNumber: true } },
          receivedBy: { select: { id: true, name: true } },
        },
      }),
      prisma.order.findMany({
        select: {
          finalAmount: true,
          paidAmount: true,
          debtAmount: true,
          paymentStatus: true,
        },
      }),
      prisma.customer.findMany({
        where: { debt: { gt: 0 } },
        orderBy: { debt: 'desc' },
        take: 10,
        select: {
          id: true,
          companyName: true,
          inn: true,
          phone: true,
          debt: true,
          branch: { select: { name: true } },
        },
      }),
    ]);

    const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);
    const totalOrderValue = orders.reduce((acc, o) => acc + o.finalAmount, 0);
    const totalOutstandingDebt = orders.reduce((acc, o) => acc + o.debtAmount, 0);

    // Method breakdown
    const methodCounts: Record<string, { count: number; total: number }> = {
      Naqd: { count: 0, total: 0 },
      Bank: { count: 0, total: 0 },
      Click: { count: 0, total: 0 },
      Payme: { count: 0, total: 0 },
      Paynet: { count: 0, total: 0 },
      HUMO: { count: 0, total: 0 },
      Uzcard: { count: 0, total: 0 },
      Boshqa: { count: 0, total: 0 },
    };

    payments.forEach((p) => {
      const m = p.method || 'Boshqa';
      if (!methodCounts[m]) {
        methodCounts[m] = { count: 0, total: 0 };
      }
      methodCounts[m].count += 1;
      methodCounts[m].total += p.amount;
    });

    return NextResponse.json({
      kpis: {
        totalRevenue,
        totalOrderValue,
        totalOutstandingDebt,
        paymentCount: payments.length,
        collectionRate: totalOrderValue > 0 ? Math.round((totalRevenue / totalOrderValue) * 100) : 0,
      },
      methodBreakdown: Object.entries(methodCounts).map(([method, data]) => ({
        method,
        count: data.count,
        total: data.total,
      })),
      recentPayments: payments.slice(0, 20),
      topDebtors: customersWithDebt,
    });
  } catch (error: any) {
    console.error('GET /api/finance/stats error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
