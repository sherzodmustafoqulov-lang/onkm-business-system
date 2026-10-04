import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateFilter = searchParams.get('dateFilter') || 'today';
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const branchFilter = searchParams.get('branchId');
    const managerFilter = searchParams.get('managerId');

    // 1. DATE FILTER LOGIC
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date();

    switch (dateFilter) {
      case 'today': {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      }
      case 'yesterday': {
        const yest = new Date(now);
        yest.setDate(yest.getDate() - 1);
        startDate = new Date(yest.getFullYear(), yest.getMonth(), yest.getDate(), 0, 0, 0);
        endDate = new Date(yest.getFullYear(), yest.getMonth(), yest.getDate(), 23, 59, 59);
        break;
      }
      case '7days': {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      }
      case '30days': {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      }
      case 'this_month': {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        break;
      }
      case 'last_month': {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        break;
      }
      case 'custom': {
        startDate = startDateParam ? new Date(startDateParam) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = endDateParam ? new Date(endDateParam) : new Date();
        break;
      }
      default: {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      }
    }

    // 2. BASE FILTERS
    const branchCondition = branchFilter && branchFilter !== 'ALL' ? { branchId: branchFilter } : {};
    const managerCondition = managerFilter && managerFilter !== 'ALL' ? { managerId: managerFilter } : {};

    // 3. TOP KPIS REAL DATABASE CALCULATIONS
    // Orders in period
    const ordersInPeriod = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: { not: 'BEKOR_QILINDI' },
        ...branchCondition,
        ...managerCondition,
      },
      include: {
        items: {
          include: {
            product: {
              select: { purchasePrice: true, sellingPrice: true },
            },
          },
        },
      },
    });

    // Today's specific orders (if filter is wider or today)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const todayOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: todayStart, lte: todayEnd },
        status: { not: 'BEKOR_QILINDI' },
        ...branchCondition,
        ...managerCondition,
      },
      include: {
        items: {
          include: {
            product: { select: { purchasePrice: true } },
          },
        },
      },
    });

    // Payments in period & today
    const paymentsInPeriod = await prisma.payment.findMany({
      where: {
        paidAt: { gte: startDate, lte: endDate },
        status: { not: 'BEKOR_QILINDI' },
        ...(branchFilter && branchFilter !== 'ALL'
          ? { customer: { branchId: branchFilter } }
          : {}),
      },
      select: {
        id: true,
        amount: true,
        method: true,
        paidAt: true,
      },
    });

    const todayPayments = await prisma.payment.findMany({
      where: {
        paidAt: { gte: todayStart, lte: todayEnd },
        status: { not: 'BEKOR_QILINDI' },
        ...(branchFilter && branchFilter !== 'ALL'
          ? { customer: { branchId: branchFilter } }
          : {}),
      },
      select: { amount: true },
    });

    // Customers in period
    const newCustomersCount = await prisma.customer.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        deletedAt: null,
        ...branchCondition,
        ...(managerFilter && managerFilter !== 'ALL' ? { managerId: managerFilter } : {}),
      },
    });

    // Installations in period
    const installationsInPeriod = await prisma.installation.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        ...branchCondition,
        ...managerCondition,
      },
    });

    // Open support tickets
    const openTicketsCount = await prisma.supportTicket.count({
      where: {
        status: { in: ['YANGI', 'JARAYONDA', 'JAVOB_KUTILMOQDA', 'TEXNIKKA_BERILDI'] },
        ...branchCondition,
      },
    });

    // Total Customer Debt across system
    const allDebtorCustomers = await prisma.customer.findMany({
      where: {
        debt: { gt: 0 },
        deletedAt: null,
        ...branchCondition,
        ...(managerFilter && managerFilter !== 'ALL' ? { managerId: managerFilter } : {}),
      },
      select: { debt: true },
    });
    const totalCustomerDebt = allDebtorCustomers.reduce((acc, c) => acc + c.debt, 0);

    // KPI Values
    // If dateFilter is today, use today's values; if custom/range, use period values for maximum insight
    const bugungiSavdo = (dateFilter === 'today' ? todayOrders : ordersInPeriod).reduce((acc, o) => acc + o.finalAmount, 0);
    const bugungiTushum = (dateFilter === 'today' ? todayPayments : paymentsInPeriod).reduce((acc, p) => acc + p.amount, 0);

    // Real gross profit (Revenue minus Product Purchase Cost / COGS)
    const targetOrdersForProfit = dateFilter === 'today' ? todayOrders : ordersInPeriod;
    let targetRevenue = 0;
    let targetCogs = 0;
    for (const o of targetOrdersForProfit) {
      targetRevenue += o.finalAmount;
      for (const item of o.items) {
        targetCogs += (item.product?.purchasePrice || 0) * item.quantity;
      }
    }
    const bugungiFoyda = targetRevenue - targetCogs;
    const profitMargin = targetRevenue > 0 ? ((bugungiFoyda / targetRevenue) * 100).toFixed(1) : '0';

    const kpis = {
      bugungiSavdo,
      bugungiTushum,
      bugungiFoyda,
      profitMargin: `${profitMargin}%`,
      yangiMijozlar: newCustomersCount,
      yangiBuyurtmalar: ordersInPeriod.length,
      ornatishlar: installationsInPeriod,
      ochiqSupport: openTicketsCount,
      qarzdorlik: totalCustomerDebt,
    };

    // 4. GRAPHS DATASETS (REAL DATABASE AGGREGATIONS)
    // 4.1 Savdo, Tushum va Foyda Dinamikasi
    // Group orders and payments by day for the selected period
    // If period is 1 day (today/yesterday), group by 4-hour intervals
    const isSingleDay = dateFilter === 'today' || dateFilter === 'yesterday';
    const timeSeriesMap: Record<string, { savdo: number; tushum: number; foyda: number; cogs: number; date: string }> = {};

    if (isSingleDay) {
      const hours = ['09:00', '12:00', '15:00', '18:00', '21:00'];
      hours.forEach((h) => {
        timeSeriesMap[h] = { savdo: 0, tushum: 0, foyda: 0, cogs: 0, date: h };
      });

      // Distribute today's orders
      ordersInPeriod.forEach((o) => {
        const hour = o.createdAt.getHours();
        let slot = '09:00';
        if (hour >= 18) slot = '21:00';
        else if (hour >= 15) slot = '18:00';
        else if (hour >= 12) slot = '15:00';
        else if (hour >= 9) slot = '12:00';

        if (timeSeriesMap[slot]) {
          timeSeriesMap[slot].savdo += o.finalAmount;
          let oCogs = 0;
          o.items.forEach((it) => (oCogs += (it.product?.purchasePrice || 0) * it.quantity));
          timeSeriesMap[slot].cogs += oCogs;
          timeSeriesMap[slot].foyda += o.finalAmount - oCogs;
        }
      });

      paymentsInPeriod.forEach((p) => {
        const hour = p.paidAt.getHours();
        let slot = '09:00';
        if (hour >= 18) slot = '21:00';
        else if (hour >= 15) slot = '18:00';
        else if (hour >= 12) slot = '15:00';
        else if (hour >= 9) slot = '12:00';

        if (timeSeriesMap[slot]) {
          timeSeriesMap[slot].tushum += p.amount;
        }
      });
    } else {
      // Group by Day (e.g. "18-Sent", "19-Sent", etc.)
      const daysCount = Math.min(30, Math.max(7, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))));
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(endDate.getTime() - i * 24 * 60 * 60 * 1000);
        const dayKey = `${d.getDate()}-${d.toLocaleDateString('uz-UZ', { month: 'short' })}`;
        timeSeriesMap[dayKey] = { savdo: 0, tushum: 0, foyda: 0, cogs: 0, date: dayKey };
      }

      ordersInPeriod.forEach((o) => {
        const dayKey = `${o.createdAt.getDate()}-${o.createdAt.toLocaleDateString('uz-UZ', { month: 'short' })}`;
        if (timeSeriesMap[dayKey]) {
          timeSeriesMap[dayKey].savdo += o.finalAmount;
          let oCogs = 0;
          o.items.forEach((it) => (oCogs += (it.product?.purchasePrice || 0) * it.quantity));
          timeSeriesMap[dayKey].cogs += oCogs;
          timeSeriesMap[dayKey].foyda += o.finalAmount - oCogs;
        }
      });

      paymentsInPeriod.forEach((p) => {
        const dayKey = `${p.paidAt.getDate()}-${p.paidAt.toLocaleDateString('uz-UZ', { month: 'short' })}`;
        if (timeSeriesMap[dayKey]) {
          timeSeriesMap[dayKey].tushum += p.amount;
        }
      });
    }

    const savdoDinamikasi = Object.values(timeSeriesMap);

    // 4.2 Tushum (Payment Methods Distribution)
    const paymentMethodsMap: Record<string, number> = {};
    paymentsInPeriod.forEach((p) => {
      paymentMethodsMap[p.method] = (paymentMethodsMap[p.method] || 0) + p.amount;
    });
    const tushumByMethod = Object.entries(paymentMethodsMap).map(([method, amount]) => ({
      method,
      amount,
    }));

    // 4.3 Support (Category and Status distribution)
    const allTicketsInPeriod = await prisma.supportTicket.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        ...branchCondition,
      },
      select: { category: true, status: true },
    });

    const ticketsByCategoryMap: Record<string, number> = {};
    const ticketsByStatusMap: Record<string, number> = {};
    allTicketsInPeriod.forEach((t) => {
      ticketsByCategoryMap[t.category] = (ticketsByCategoryMap[t.category] || 0) + 1;
      ticketsByStatusMap[t.status] = (ticketsByStatusMap[t.status] || 0) + 1;
    });

    const supportCategories = Object.entries(ticketsByCategoryMap).map(([category, count]) => ({
      category,
      count,
    })).sort((a, b) => b.count - a.count);

    // 4.4 Filiallar Dinamikasi (Branch Performance)
    const allBranches = await prisma.branch.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        orders: {
          where: {
            createdAt: { gte: startDate, lte: endDate },
            status: { not: 'BEKOR_QILINDI' },
          },
          select: { finalAmount: true },
        },
        customers: { select: { id: true } },
        fiscalModules: {
          where: { status: { in: ['OMBORDA', 'FILIALDA'] } },
          select: { id: true },
        },
      },
    });

    const filiallarDinamikasi = allBranches.map((b) => {
      const salesVolume = b.orders.reduce((acc, o) => acc + o.finalAmount, 0);
      return {
        id: b.id,
        name: b.name.replace(' filiali', ''),
        code: b.code,
        sales: salesVolume,
        ordersCount: b.orders.length,
        customersCount: b.customers.length,
        availableFm: b.fiscalModules.length,
      };
    }).sort((a, b) => b.sales - a.sales);

    // 4.5 Menejerlar Dinamikasi & Yangi Mijozlar (Manager Leaderboard & Onboarding KPI)
    const managers = await prisma.user.findMany({
      where: {
        OR: [
          { role: { name: 'MANAGER' } },
          { managedCustomers: { some: {} } },
          { managedOrders: { some: {} } },
        ],
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        branch: { select: { name: true } },
        managedOrders: {
          where: {
            createdAt: { gte: startDate, lte: endDate },
            status: { not: 'BEKOR_QILINDI' },
          },
          select: { finalAmount: true, paidAmount: true, debtAmount: true },
        },
        managedCustomers: {
          where: {
            createdAt: { gte: startDate, lte: endDate },
            deletedAt: null,
          },
          select: {
            id: true,
            companyName: true,
            status: true,
            ofdStatus: true,
            createdAt: true,
            productSerials: { select: { id: true } },
            fiscalModules: { select: { id: true } },
          },
        },
        _count: {
          select: {
            managedCustomers: { where: { deletedAt: null } },
            managedOrders: true,
          },
        },
      },
    });

    const menejerlarDinamikasi = managers.map((m) => {
      const totalSales = m.managedOrders.reduce((acc, o) => acc + o.finalAmount, 0);
      const totalPaid = m.managedOrders.reduce((acc, o) => acc + o.paidAmount, 0);
      const totalDebt = m.managedOrders.reduce((acc, o) => acc + o.debtAmount, 0);
      const newCustomersCount = m.managedCustomers.length;
      const totalCustomersCount = m._count.managedCustomers;
      const newDevicesCount = m.managedCustomers.reduce(
        (sum, c) => sum + (c.productSerials?.length || 0) + (c.fiscalModules?.length || 0),
        0
      );
      const ofdConnectedCount = m.managedCustomers.filter((c) => c.ofdStatus === 'ULANGAN').length;

      return {
        id: m.id,
        name: m.name.split(' ')[0] + ' ' + (m.name.split(' ')[1] || ''),
        fullName: m.name,
        branchName: m.branch?.name || 'Bosh filial',
        totalSales,
        totalPaid,
        totalDebt,
        ordersCount: m.managedOrders.length,
        newCustomersCount,
        totalCustomersCount,
        newDevicesCount,
        ofdConnectedCount,
      };
    }).sort((a, b) => (b.newCustomersCount - a.newCustomersCount) || (b.totalSales - a.totalSales));

    // 4.6 Mijozlar Dinamikasi (Type & Status breakdown)
    const customersForGraph = await prisma.customer.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        deletedAt: null,
        ...branchCondition,
      },
      select: { companyType: true, status: true },
    });

    const customerTypesMap: Record<string, number> = {};
    customersForGraph.forEach((c) => {
      customerTypesMap[c.companyType] = (customerTypesMap[c.companyType] || 0) + 1;
    });
    const mijozlarDinamikasi = Object.entries(customerTypesMap).map(([type, count]) => ({
      type,
      count,
    }));

    // 5. TABLES DATASETS (REAL DATABASE QUERIES)
    // 5.1 Oxirgi Buyurtmalar (Recent Orders)
    const oxirgiBuyurtmalar = await prisma.order.findMany({
      where: {
        ...branchCondition,
        ...managerCondition,
      },
      take: 8,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        finalAmount: true,
        paidAmount: true,
        debtAmount: true,
        status: true,
        pipelineStage: true,
        paymentStatus: true,
        createdAt: true,
        customer: { select: { companyName: true, phone: true } },
        manager: { select: { name: true } },
        branch: { select: { name: true } },
      },
    });

    // 5.2 Ochiq Supportlar (Open Support Tickets)
    const ochiqSupportlar = await prisma.supportTicket.findMany({
      where: {
        status: { in: ['YANGI', 'JARAYONDA', 'JAVOB_KUTILMOQDA', 'TEXNIKKA_BERILDI'] },
        ...branchCondition,
      },
      take: 8,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        ticketNumber: true,
        category: true,
        issue: true,
        priority: true,
        status: true,
        deviceName: true,
        serialNumber: true,
        createdAt: true,
        customer: { select: { companyName: true, phone: true } },
        assignedTo: { select: { name: true } },
      },
    });

    // 5.3 Bugungi O'rnatishlar (Today's / Active Installations)
    const bugungiOrnatishlar = await prisma.installation.findMany({
      where: {
        status: { notIn: ['YAKUNLANDI', 'BEKOR_QILINDI'] },
        ...branchCondition,
        ...managerCondition,
      },
      take: 8,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        taskNumber: true,
        deviceName: true,
        serialNumber: true,
        serviceType: true,
        status: true,
        scheduledDate: true,
        scheduledTime: true,
        location: true,
        createdAt: true,
        customer: { select: { companyName: true, phone: true } },
        technician: { select: { name: true, phone: true } },
      },
    });

    // 5.4 Kam Qolgan Mahsulotlar (Low Stock Products from Stock)
    const productsWithStock = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: { select: { name: true } },
        stock: true,
      },
    });

    const kamQolganMahsulotlar = productsWithStock
      .map((p) => {
        const totalQty = p.stock.reduce((sum, s) => sum + s.quantity, 0);
        const totalRes = p.stock.reduce((sum, s) => sum + s.reserved, 0);
        const available = totalQty - totalRes;
        return {
          id: p.id,
          name: p.name,
          sku: p.sku,
          category: p.category.name,
          minStock: p.minStock,
          totalQuantity: totalQty,
          reserved: totalRes,
          available,
          isLow: available <= p.minStock,
        };
      })
      .filter((p) => p.isLow || p.available <= p.minStock)
      .slice(0, 8);

    // 5.5 Qarzdor Mijozlar (Top Debtors)
    const qarzdorMijozlar = await prisma.customer.findMany({
      where: {
        debt: { gt: 0 },
        deletedAt: null,
        ...branchCondition,
        ...(managerFilter && managerFilter !== 'ALL' ? { managerId: managerFilter } : {}),
      },
      take: 8,
      orderBy: { debt: 'desc' },
      select: {
        id: true,
        companyName: true,
        inn: true,
        phone: true,
        debt: true,
        ofdStatus: true,
        branch: { select: { name: true } },
        manager: { select: { name: true } },
      },
    });

    // 5.6 Oxirgi Ulangan Mijozlar (Recent Customers Onboarded by Managers)
    const oxirgiUlanganMijozlar = await prisma.customer.findMany({
      where: {
        deletedAt: null,
        ...branchCondition,
        ...(managerFilter && managerFilter !== 'ALL' ? { managerId: managerFilter } : {}),
      },
      take: 8,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        companyName: true,
        inn: true,
        phone: true,
        companyType: true,
        status: true,
        ofdStatus: true,
        debt: true,
        createdAt: true,
        manager: { select: { id: true, name: true } },
        branch: { select: { name: true } },
        productSerials: { select: { id: true, serialNumber: true } },
        fiscalModules: { select: { id: true, serialNumber: true } },
      },
    });

    // 6. METADATA FOR FILTERS
    const [filterBranches, filterManagers] = await Promise.all([
      prisma.branch.findMany({
        select: { id: true, name: true, code: true },
        orderBy: { name: 'asc' },
      }),
      prisma.user.findMany({
        where: {
          OR: [
            { role: { name: 'MANAGER' } },
            { managedCustomers: { some: {} } },
          ],
          isActive: true,
        },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      filters: {
        dateFilter,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        branchId: branchFilter || 'ALL',
        managerId: managerFilter || 'ALL',
        availableBranches: filterBranches,
        availableManagers: filterManagers,
      },
      kpis,
      graphs: {
        savdoDinamikasi,
        tushumByMethod,
        supportCategories,
        filiallarDinamikasi,
        menejerlarDinamikasi,
        mijozlarDinamikasi,
      },
      tables: {
        oxirgiBuyurtmalar,
        oxirgiUlanganMijozlar,
        menejerlarReytingi: menejerlarDinamikasi,
        ochiqSupportlar,
        bugungiOrnatishlar,
        kamQolganMahsulotlar,
        qarzdorMijozlar,
      },
    });
  } catch (error: any) {
    console.error('Dashboard stats API error:', error);
    return NextResponse.json(
      { error: 'Dashboard ma\'lumotlarini yuklashda xatolik', details: error?.message },
      { status: 500 }
    );
  }
}
