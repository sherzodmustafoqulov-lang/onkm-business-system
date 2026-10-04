import prisma from '../prisma';

export interface UserContext {
  id: string;
  name: string;
  email: string;
  role: string;
  roleDisplayName?: string;
  branchId?: string | null;
  branchName?: string;
  permissions?: Array<{
    resource: string;
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canApprove: boolean;
    canExport: boolean;
    canFinanceView: boolean;
    canSensitiveDataView: boolean;
  }>;
}

export interface ToolResult<T = any> {
  success: boolean;
  tool: string;
  data?: T;
  error?: string;
  message?: string;
}

// Yordamchi ruxsat tekshirish funksiyasi
export function checkUserPermission(
  user: UserContext,
  resource: string,
  action: 'view' | 'create' | 'edit' | 'delete' | 'finance' | 'sensitive' = 'view'
): boolean {
  if (user.role === 'ADMIN') return true;

  const perm = user.permissions?.find((p) => p.resource === resource);
  if (!perm) return false;

  switch (action) {
    case 'view':
      return perm.canView;
    case 'finance':
      return perm.canFinanceView;
    case 'sensitive':
      return perm.canSensitiveDataView;
    case 'create':
      return perm.canCreate;
    case 'edit':
      return perm.canEdit;
    case 'delete':
      return perm.canDelete;
    default:
      return false;
  }
}

/**
 * 1. getCustomers
 * Ruxsat: CUSTOMERS resursini ko'rish huquqi
 * Menejer bo'lsa: faqat o'ziga biriktirilgan mijozlar (yoki myOnly parametri bilan)
 */
export async function getCustomers(
  user: UserContext,
  params: { search?: string; status?: string; myOnly?: boolean; limit?: number } = {}
): Promise<ToolResult> {
  if (!checkUserPermission(user, 'CUSTOMERS', 'view')) {
    return {
      success: false,
      tool: 'getCustomers',
      error: 'PERMISSION_DENIED',
      message: 'Kechirasiz, sizning rolingizda mijozlar ma\'lumotlarini ko\'rish huquqi mavjud emas.',
    };
  }

  const where: any = {};
  if (params.status) {
    where.status = params.status;
  }

  // Agar foydalanuvchi menejer bo'lsa yoki myOnly so'ralsa
  if (user.role === 'MANAGER' || params.myOnly) {
    where.managerId = user.id;
  }

  if (params.search) {
    where.OR = [
      { companyName: { contains: params.search } },
      { contactPerson: { contains: params.search } },
      { director: { contains: params.search } },
      { inn: { contains: params.search } },
      { phone: { contains: params.search } },
    ];
  }

  const [totalCount, customers] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      take: params.limit || 15,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        companyName: true,
        inn: true,
        phone: true,
        status: true,
        debt: true,
        companyType: true,
        contactPerson: true,
        director: true,
        branch: { select: { name: true } },
        manager: { select: { name: true } },
      },
    }),
  ]);

  return {
    success: true,
    tool: 'getCustomers',
    data: {
      totalCount,
      scope: user.role === 'MANAGER' || params.myOnly ? 'Faqat o\'zingizga biriktirilgan' : 'Barcha mijozlar',
      customers,
    },
  };
}

/**
 * 2. getOrders
 * Ruxsat: SALES resursini ko'rish huquqi
 * Menejer bo'lsa: faqat o'z buyurtmalari
 * Omborchi bo'lsa: faqat chiqarishga tayyor/rezervdagi buyurtmalar
 */
export async function getOrders(
  user: UserContext,
  params: { status?: string; pipelineStage?: string; myOnly?: boolean; limit?: number } = {}
): Promise<ToolResult> {
  if (!checkUserPermission(user, 'SALES', 'view') && user.role !== 'WAREHOUSE') {
    return {
      success: false,
      tool: 'getOrders',
      error: 'PERMISSION_DENIED',
      message: 'Kechirasiz, sizning rolingizda buyurtmalarni ko\'rish huquqi mavjud emas.',
    };
  }

  const where: any = {};

  if (user.role === 'MANAGER' || params.myOnly) {
    where.managerId = user.id;
  }

  if (user.role === 'WAREHOUSE') {
    // Omborchi faqat ombor bilan bog'liq etaplarni ko'radi
    where.pipelineStage = { in: ['REZERV', 'CHIQARISH', 'YETKAZISH'] };
  }

  if (params.status) {
    where.status = params.status;
  }
  if (params.pipelineStage) {
    where.pipelineStage = params.pipelineStage;
  }

  const [totalCount, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      take: params.limit || 15,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        customer: { select: { companyName: true, contactPerson: true, phone: true } },
        manager: { select: { name: true } },
        branch: { select: { name: true } },
        totalAmount: true,
        paidAmount: true,
        debtAmount: true,
        status: true,
        pipelineStage: true,
        paymentStatus: true,
        createdAt: true,
        items: {
          select: {
            quantity: true,
            product: { select: { name: true, sku: true } },
          },
        },
      },
    }),
  ]);

  return {
    success: true,
    tool: 'getOrders',
    data: {
      totalCount,
      scope: user.role === 'MANAGER' || params.myOnly ? 'Faqat shaxsiy buyurtmalaringiz' : 'Tizim bo\'yicha buyurtmalar',
      orders,
    },
  };
}

/**
 * 3. getSales
 * Ruxsat: SALES resursi yoki ADMIN
 * Admin: Bugungi savdo, umumiy savdo, menejerlar bo'yicha savdo
 * Menejer: Faqat shaxsiy savdosi
 */
export async function getSales(
  user: UserContext,
  params: { period?: 'today' | 'week' | 'month' | 'all'; byManager?: boolean; myOnly?: boolean } = {}
): Promise<ToolResult> {
  if (!checkUserPermission(user, 'SALES', 'view')) {
    return {
      success: false,
      tool: 'getSales',
      error: 'PERMISSION_DENIED',
      message: 'Kechirasiz, sizda savdo statistikasini ko\'rish huquqi mavjud emas.',
    };
  }

  // Agar menejer boshqalarning yoki kompaniyaning umumiy savdosini so'rasa, faqat o'zinikiga cheklanadi
  const isManagerScoped = user.role === 'MANAGER' || params.myOnly;

  // Vaqt oralig'i filtri
  const now = new Date();
  let startDate: Date | undefined;

  if (params.period === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (params.period === 'week') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (params.period === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const where: any = {
    status: { not: 'BEKOR_QILINDI' },
  };

  if (startDate) {
    where.createdAt = { gte: startDate };
  }

  if (isManagerScoped) {
    where.managerId = user.id;
  }

  // Agar Admin menejerlar bo'yicha taqsimot so'ragan bo'lsa
  if (params.byManager && user.role === 'ADMIN') {
    const managers = await prisma.user.findMany({
      where: { role: { name: 'MANAGER' } },
      select: {
        id: true,
        name: true,
        email: true,
        managedOrders: {
          where: startDate ? { createdAt: { gte: startDate }, status: { not: 'BEKOR_QILINDI' } } : { status: { not: 'BEKOR_QILINDI' } },
          select: {
            finalAmount: true,
            paidAmount: true,
            status: true,
          },
        },
      },
    });

    const managerPerformance = managers.map((m) => {
      const totalVolume = m.managedOrders.reduce((acc: number, o: { finalAmount: number }) => acc + o.finalAmount, 0);
      const paidVolume = m.managedOrders.reduce((acc: number, o: { paidAmount: number }) => acc + o.paidAmount, 0);
      return {
        managerId: m.id,
        managerName: m.name,
        ordersCount: m.managedOrders.length,
        totalSales: totalVolume,
        collectedPayments: paidVolume,
      };
    }).sort((a, b) => b.totalSales - a.totalSales);

    return {
      success: true,
      tool: 'getSales',
      data: {
        period: params.period || 'all',
        managerBreakdown: managerPerformance,
      },
    };
  }

  // Umumiy yoki shaxsiy savdo summasi
  const orders = await prisma.order.findMany({
    where,
    select: {
      id: true,
      finalAmount: true,
      paidAmount: true,
      debtAmount: true,
      status: true,
    },
  });

  const totalSalesAmount = orders.reduce((sum, o) => sum + o.finalAmount, 0);
  const totalPaidAmount = orders.reduce((sum, o) => sum + o.paidAmount, 0);
  const totalDebtAmount = orders.reduce((sum, o) => sum + o.debtAmount, 0);

  return {
    success: true,
    tool: 'getSales',
    data: {
      period: params.period || 'all',
      ordersCount: orders.length,
      totalSalesAmount,
      totalPaidAmount,
      totalDebtAmount,
      scope: isManagerScoped ? 'Sizning shaxsiy savdo ko\'rsatkichingiz' : 'Kompaniya bo\'yicha umumiy savdo',
    },
  };
}

/**
 * 4. getPayments
 * Ruxsat: FINANCE canFinanceView yoki ADMIN / ACCOUNTANT
 */
export async function getPayments(
  user: UserContext,
  params: { period?: 'today' | 'week' | 'month'; limit?: number } = {}
): Promise<ToolResult> {
  const hasFinanceAccess = user.role === 'ADMIN' || user.role === 'ACCOUNTANT' || checkUserPermission(user, 'FINANCE', 'finance');
  if (!hasFinanceAccess) {
    return {
      success: false,
      tool: 'getPayments',
      error: 'PERMISSION_DENIED',
      message: 'Kechirasiz, to\'lovlar va kassa aylanmasini ko\'rish uchun ruxsat etilmagan.',
    };
  }

  const now = new Date();
  let startDate: Date | undefined;
  if (params.period === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (params.period === 'week') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (params.period === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const where: any = { status: { not: 'BEKOR_QILINDI' } };
  if (startDate) {
    where.paidAt = { gte: startDate };
  }

  const [totalCount, payments] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      take: params.limit || 20,
      orderBy: { paidAt: 'desc' },
      select: {
        id: true,
        paymentNumber: true,
        amount: true,
        method: true,
        paidAt: true,
        customer: { select: { companyName: true, contactPerson: true } },
        receivedBy: { select: { name: true } },
      },
    }),
  ]);

  const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);

  // To'lov turlari bo'yicha
  const byMethod: Record<string, number> = {};
  payments.forEach((p) => {
    byMethod[p.method] = (byMethod[p.method] || 0) + p.amount;
  });

  return {
    success: true,
    tool: 'getPayments',
    data: {
      period: params.period || 'all',
      totalCount,
      totalCollected,
      byMethod,
      payments,
    },
  };
}

/**
 * 5. getStock
 * Ruxsat: WAREHOUSE canView, ADMIN yoki MANAGER
 * So'rovlar: "Qaysi mahsulot kam qolgan?", "Qaysi filialda mahsulot bor?"
 */
export async function getStock(
  user: UserContext,
  params: { isLowStock?: boolean; productId?: string; branchId?: string; search?: string } = {}
): Promise<ToolResult> {
  const isAllowed = user.role === 'ADMIN' || user.role === 'WAREHOUSE' || user.role === 'MANAGER' || checkUserPermission(user, 'WAREHOUSE', 'view');
  if (!isAllowed) {
    return {
      success: false,
      tool: 'getStock',
      error: 'PERMISSION_DENIED',
      message: 'Kechirasiz, sizda ombor qoldiqlari ma\'lumotlarini ko\'rish huquqi mavjud emas.',
    };
  }

  const productWhere: any = { isActive: true };
  if (params.search) {
    productWhere.OR = [
      { name: { contains: params.search } },
      { sku: { contains: params.search } },
      { model: { contains: params.search } },
    ];
  }

  const products = await prisma.product.findMany({
    where: productWhere,
    include: {
      category: { select: { name: true } },
      stock: {
        include: {
          branch: { select: { id: true, name: true, code: true } },
        },
      },
    },
  });

  // Har bir mahsulot bo'yicha jami qoldiq va kam qolganlikni hisoblaymiz
  const productStockList = products.map((p) => {
    const totalQty = p.stock.reduce((sum, s) => sum + s.quantity, 0);
    const totalReserved = p.stock.reduce((sum, s) => sum + s.reserved, 0);
    const available = totalQty - totalReserved;
    const isLow = available <= p.minStock;

    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      category: p.category.name,
      minStock: p.minStock,
      totalQuantity: totalQty,
      reserved: totalReserved,
      available,
      isLowStock: isLow,
      branches: p.stock.map((s) => ({
        branchId: s.branch.id,
        branchName: s.branch.name,
        branchCode: s.branch.code,
        quantity: s.quantity,
        available: s.quantity - s.reserved,
      })),
    };
  });

  let result = productStockList;
  if (params.isLowStock) {
    result = result.filter((p) => p.isLowStock || p.available <= p.minStock);
  }

  return {
    success: true,
    tool: 'getStock',
    data: {
      filterApplied: params.isLowStock ? 'Faqat kam qolgan (tanqis) tovarlar' : 'Barcha tovarlar',
      count: result.length,
      products: result,
    },
  };
}

/**
 * 6. getFiscalModules
 * Ruxsat: WAREHOUSE canView yoki ADMIN
 * So'rovlar: "FM qoldig'i qancha?", "Qaysi filialda FM kam?"
 */
export async function getFiscalModules(
  user: UserContext,
  params: { lowStockOnly?: boolean; branchId?: string; summary?: boolean } = {}
): Promise<ToolResult> {
  const isAllowed = user.role === 'ADMIN' || user.role === 'WAREHOUSE' || user.role === 'MANAGER' || checkUserPermission(user, 'WAREHOUSE', 'view');
  if (!isAllowed) {
    return {
      success: false,
      tool: 'getFiscalModules',
      error: 'PERMISSION_DENIED',
      message: 'Kechirasiz, sizda Fiskal Modullar (FM) qoldig\'ini ko\'rish huquqi mavjud emas.',
    };
  }

  const branches = await prisma.branch.findMany({
    select: {
      id: true,
      name: true,
      code: true,
      fiscalModules: {
        select: {
          id: true,
          serialNumber: true,
          status: true,
        },
      },
    },
  });

  const branchSummary = branches.map((b) => {
    const total = b.fiscalModules.length;
    const available = b.fiscalModules.filter((fm) => fm.status === 'OMBORDA' || fm.status === 'FILIALDA').length;
    const reserved = b.fiscalModules.filter((fm) => fm.status === 'REZERV').length;
    const installed = b.fiscalModules.filter((fm) => fm.status === 'O\'RNATILDI' || fm.status === 'FAOL').length;

    // Kritik chegara: agar mavjud FM lar soni 5 tadan kam bo'lsa
    const isLow = available < 5;

    return {
      branchId: b.id,
      branchName: b.name,
      branchCode: b.code,
      availableCount: available,
      reservedCount: reserved,
      installedCount: installed,
      totalCount: total,
      isLow,
    };
  });

  const totalAvailableAll = branchSummary.reduce((sum, b) => sum + b.availableCount, 0);
  const totalReservedAll = branchSummary.reduce((sum, b) => sum + b.reservedCount, 0);

  let outputBranches = branchSummary;
  if (params.lowStockOnly) {
    outputBranches = branchSummary.filter((b) => b.isLow || b.availableCount < 5);
  }

  return {
    success: true,
    tool: 'getFiscalModules',
    data: {
      totalAvailableAcrossSystem: totalAvailableAll,
      totalReservedAcrossSystem: totalReservedAll,
      criticalThreshold: 5,
      lowStockBranchesCount: branchSummary.filter((b) => b.isLow).length,
      branches: outputBranches,
    },
  };
}

/**
 * 7. getSupportTickets
 * Ruxsat: SUPPORT canView (ADMIN, SUPPORT, MANAGER, TECHNICIAN)
 * So'rovlar: "Ochiq supportlar nechta?", "Mening ticketlarim", "Kechikkan ticketlar", "Bugungi ticketlar"
 */
export async function getSupportTickets(
  user: UserContext,
  params: {
    status?: 'open' | 'all' | 'closed' | string;
    myOnly?: boolean;
    overdue?: boolean;
    period?: 'today' | 'all';
    limit?: number;
  } = {}
): Promise<ToolResult> {
  const isAllowed = user.role === 'ADMIN' || user.role === 'SUPPORT' || user.role === 'MANAGER' || user.role === 'TECHNICIAN' || checkUserPermission(user, 'SUPPORT', 'view');
  if (!isAllowed) {
    return {
      success: false,
      tool: 'getSupportTickets',
      error: 'PERMISSION_DENIED',
      message: 'Kechirasiz, sizda texnik support murojaatlarini ko\'rish huquqi mavjud emas.',
    };
  }

  const where: any = {};

  // Status filtri
  if (params.status === 'open') {
    where.status = { notIn: ['YECHILDI', 'YOPILDI'] };
  } else if (params.status === 'closed') {
    where.status = { in: ['YECHILDI', 'YOPILDI'] };
  } else if (params.status && params.status !== 'all') {
    where.status = params.status;
  }

  // Mening ticketlarim
  if (params.myOnly || user.role === 'SUPPORT') {
    if (params.myOnly) {
      if (user.role === 'SUPPORT') {
        where.assignedToId = user.id;
      } else if (user.role === 'TECHNICIAN') {
        where.technicianId = user.id;
      } else if (user.role === 'MANAGER') {
        // Menejerning mijozlariga tegishli ticketlar
        where.customer = { managerId: user.id };
      }
    }
  }

  // Bugungi ticketlar
  if (params.period === 'today') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    where.createdAt = { gte: today };
  }

  // Kechikkan ticketlar (24 soatdan ortiq hal qilinmagan yoki shoshilinch)
  if (params.overdue) {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    where.status = { notIn: ['YECHILDI', 'YOPILDI'] };
    where.createdAt = { lte: yesterday };
  }

  const [totalCount, tickets] = await Promise.all([
    prisma.supportTicket.count({ where }),
    prisma.supportTicket.findMany({
      where,
      take: params.limit || 20,
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
        customer: { select: { companyName: true, contactPerson: true, phone: true } },
        assignedTo: { select: { name: true } },
      },
    }),
  ]);

  return {
    success: true,
    tool: 'getSupportTickets',
    data: {
      totalCount,
      filter: {
        status: params.status || 'barchasi',
        myOnly: !!params.myOnly,
        overdue: !!params.overdue,
        period: params.period || 'barchasi',
      },
      tickets,
    },
  };
}

/**
 * 8. getInstallations
 * Ruxsat: INSTALLATIONS canView (ADMIN, TECHNICIAN, MANAGER, SUPPORT)
 * Texnik: faqat o'z vazifalari
 * Menejer: o'z buyurtmalari bo'yicha o'rnatishlar
 */
export async function getInstallations(
  user: UserContext,
  params: { status?: string; myOnly?: boolean; limit?: number } = {}
): Promise<ToolResult> {
  const isAllowed = user.role === 'ADMIN' || user.role === 'TECHNICIAN' || user.role === 'MANAGER' || checkUserPermission(user, 'INSTALLATIONS', 'view');
  if (!isAllowed) {
    return {
      success: false,
      tool: 'getInstallations',
      error: 'PERMISSION_DENIED',
      message: 'Kechirasiz, sizda o\'rnatish vazifalari ma\'lumotlarini ko\'rish huquqi mavjud emas.',
    };
  }

  const where: any = {};

  if (user.role === 'TECHNICIAN' || params.myOnly) {
    if (user.role === 'TECHNICIAN') {
      where.technicianId = user.id;
    } else if (user.role === 'MANAGER') {
      where.managerId = user.id;
    }
  }

  if (params.status) {
    where.status = params.status;
  }

  const [totalCount, installations] = await Promise.all([
    prisma.installation.count({ where }),
    prisma.installation.findMany({
      where,
      take: params.limit || 15,
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
        customer: { select: { companyName: true, contactPerson: true, phone: true } },
        technician: { select: { name: true, phone: true } },
        manager: { select: { name: true } },
      },
    }),
  ]);

  return {
    success: true,
    tool: 'getInstallations',
    data: {
      totalCount,
      scope: user.role === 'TECHNICIAN' || params.myOnly ? 'Faqat shaxsiy vazifalaringiz' : 'Barcha o\'rnatish vazifalari',
      installations,
    },
  };
}

/**
 * 9. getReports
 * Ruxsat: STRICTLY ADMIN yoki ACCOUNTANT (canFinanceView)
 * So'rovlar: "Bugungi foyda qancha?", umumiy moliyaviy hisobot
 */
export async function getReports(
  user: UserContext,
  params: { type: 'profit' | 'overview' | 'margin'; period?: 'today' | 'month' | 'all' } = { type: 'profit' }
): Promise<ToolResult> {
  const isFinanceAdmin = user.role === 'ADMIN' || (user.role === 'ACCOUNTANT' && checkUserPermission(user, 'FINANCE', 'finance'));
  if (!isFinanceAdmin) {
    return {
      success: false,
      tool: 'getReports',
      error: 'PERMISSION_DENIED',
      message: 'Kechirasiz, foyda va moliyaviy hisobotlarni ko\'rish faqat Administrator va Bosh buxgalter uchun ruxsat etilgan.',
    };
  }

  const now = new Date();
  let startDate: Date | undefined;
  if (params.period === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (params.period === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const orderWhere: any = {
    status: { not: 'BEKOR_QILINDI' },
  };
  if (startDate) {
    orderWhere.createdAt = { gte: startDate };
  }

  // Buyurtmalar va ularning mahsulot tannarxini (purchasePrice) hisoblaymiz
  const orders = await prisma.order.findMany({
    where: orderWhere,
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

  let totalRevenue = 0;
  let totalCostOfGoodsSold = 0;

  for (const o of orders) {
    totalRevenue += o.finalAmount;
    for (const item of o.items) {
      const unitCost = item.product?.purchasePrice || 0;
      totalCostOfGoodsSold += unitCost * item.quantity;
    }
  }

  const grossProfit = totalRevenue - totalCostOfGoodsSold;
  const marginPercentage = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : '0';

  return {
    success: true,
    tool: 'getReports',
    data: {
      reportType: params.type,
      period: params.period || 'all',
      ordersCount: orders.length,
      totalRevenue,
      totalCostOfGoodsSold,
      grossProfit,
      marginPercentage: `${marginPercentage}%`,
    },
  };
}
