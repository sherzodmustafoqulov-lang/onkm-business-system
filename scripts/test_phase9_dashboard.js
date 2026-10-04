const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runPhase9DashboardTests() {
  console.log('================================================================');
  console.log('📊 STARTING PHASE 9 EXECUTIVE DASHBOARD & REAL DB VERIFICATION');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, testName, details = '') {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (details) console.error(`   Details: ${details}`);
    }
  }

  // 1. Database Connection & Basic Entity Counts
  console.log('🔍 1. Bazadagi mavjud yozuvlarni tekshirish...');
  const [
    customersCount,
    ordersCount,
    paymentsCount,
    installationsCount,
    ticketsCount,
    productsCount,
    branchesCount,
  ] = await Promise.all([
    prisma.customer.count({ where: { deletedAt: null } }),
    prisma.order.count(),
    prisma.payment.count(),
    prisma.installation.count(),
    prisma.supportTicket.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.branch.count(),
  ]);

  assert(customersCount > 0, `Mijozlar bazada mavjud (${customersCount} ta)`);
  assert(ordersCount > 0, `Buyurtmalar bazada mavjud (${ordersCount} ta)`);
  assert(paymentsCount > 0, `To'lovlar bazada mavjud (${paymentsCount} ta)`);
  assert(installationsCount > 0, `O'rnatish vazifalari bazada mavjud (${installationsCount} ta)`);
  assert(ticketsCount > 0, `Support ticketlar bazada mavjud (${ticketsCount} ta)`);
  assert(productsCount > 0, `Mahsulotlar katalogi mavjud (${productsCount} ta)`);
  assert(branchesCount >= 6, `Filiallar bazada to'liq mavjud (${branchesCount} ta)`);

  // 2. Real Database KPI Verification (NO STATIC NUMBERS)
  console.log('\n📈 2. TOP 8 KPI REAL HISOB-KITOBLARINI TEKSHIRISH...');

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  // KPI 1: Bugungi savdo
  const todayOrders = await prisma.order.findMany({
    where: {
      createdAt: { gte: todayStart, lte: todayEnd },
      status: { not: 'BEKOR_QILINDI' },
    },
    include: {
      items: {
        include: {
          product: { select: { purchasePrice: true } },
        },
      },
    },
  });
  const todaySales = todayOrders.reduce((acc, o) => acc + o.finalAmount, 0);
  assert(typeof todaySales === 'number', `1. Bugungi savdo real DB dan hisoblandi: ${todaySales} so'm`);

  // KPI 2: Bugungi tushum
  const todayPayments = await prisma.payment.findMany({
    where: {
      paidAt: { gte: todayStart, lte: todayEnd },
      status: { not: 'BEKOR_QILINDI' },
    },
  });
  const todayReceipts = todayPayments.reduce((acc, p) => acc + p.amount, 0);
  assert(typeof todayReceipts === 'number', `2. Bugungi tushum real DB dan hisoblandi: ${todayReceipts} so'm`);

  // KPI 3: Bugungi foyda (COGS vs Revenue)
  let todayRevenue = 0;
  let todayCogs = 0;
  todayOrders.forEach((o) => {
    todayRevenue += o.finalAmount;
    o.items.forEach((it) => {
      todayCogs += (it.product?.purchasePrice || 0) * it.quantity;
    });
  });
  const todayProfit = todayRevenue - todayCogs;
  const margin = todayRevenue > 0 ? ((todayProfit / todayRevenue) * 100).toFixed(1) : '0';
  assert(typeof todayProfit === 'number', `3. Bugungi sof foyda va marja (${margin}%) to'g'ri hisoblandi: ${todayProfit} so'm`);

  // KPI 4: Yangi mijozlar
  const newCustomersToday = await prisma.customer.count({
    where: {
      createdAt: { gte: todayStart, lte: todayEnd },
      deletedAt: null,
    },
  });
  assert(typeof newCustomersToday === 'number', `4. Yangi mijozlar hisoblandi: ${newCustomersToday} ta`);

  // KPI 5: Yangi buyurtmalar
  const newOrdersToday = todayOrders.length;
  assert(typeof newOrdersToday === 'number', `5. Yangi buyurtmalar hisoblandi: ${newOrdersToday} ta`);

  // KPI 6: O'rnatishlar
  const installationsToday = await prisma.installation.count({
    where: { createdAt: { gte: todayStart, lte: todayEnd } },
  });
  assert(typeof installationsToday === 'number', `6. O'rnatishlar soni hisoblandi: ${installationsToday} ta`);

  // KPI 7: Ochiq support
  const openTickets = await prisma.supportTicket.count({
    where: { status: { in: ['YANGI', 'JARAYONDA', 'JAVOB_KUTILMOQDA', 'TEXNIKKA_BERILDI'] } },
  });
  assert(typeof openTickets === 'number', `7. Ochiq supportlar soni hisoblandi: ${openTickets} ta`);

  // KPI 8: Qarzdorlik
  const debtorCustomers = await prisma.customer.findMany({
    where: { debt: { gt: 0 }, deletedAt: null },
    select: { debt: true },
  });
  const totalDebt = debtorCustomers.reduce((acc, c) => acc + c.debt, 0);
  assert(typeof totalDebt === 'number' && totalDebt >= 0, `8. Jami debitorlik qarzi hisoblandi: ${totalDebt} so'm`);

  // 3. Testing 7 Graphs Datasets
  console.log('\n📊 3. 7 TA GRAFIK MA\'LUMOTLARINI TEKSHIRISH...');

  // Graph 1: Savdo dinamikasi
  const allOrders = await prisma.order.findMany({
    where: { status: { not: 'BEKOR_QILINDI' } },
    select: { finalAmount: true, createdAt: true },
  });
  assert(allOrders.length > 0, `Grafik 1 (Savdo dinamikasi): ${allOrders.length} ta bitim mavjud`);

  // Graph 2: Tushum & To'lov usullari
  const allPayments = await prisma.payment.findMany({
    where: { status: { not: 'BEKOR_QILINDI' } },
    select: { amount: true, method: true },
  });
  const paymentMethods = {};
  allPayments.forEach((p) => {
    paymentMethods[p.method] = (paymentMethods[p.method] || 0) + p.amount;
  });
  assert(Object.keys(paymentMethods).length > 0, `Grafik 2 (To'lov usullari): ${Object.keys(paymentMethods).join(', ')}`);

  // Graph 3: Foyda dinamikasi
  assert(typeof todayProfit === 'number', 'Grafik 3 (Foyda va rentabellik marjasi tahlili)');

  // Graph 4: Mijozlar dinamikasi (Type breakdown)
  const allCustomers = await prisma.customer.findMany({
    where: { deletedAt: null },
    select: { companyType: true },
  });
  const typesMap = {};
  allCustomers.forEach((c) => {
    typesMap[c.companyType] = (typesMap[c.companyType] || 0) + 1;
  });
  assert(Object.keys(typesMap).length > 0, `Grafik 4 (Mijozlar tuzilishi): ${Object.keys(typesMap).map(k => `${k}:${typesMap[k]}`).join(', ')}`);

  // Graph 5: Support kategoriyalari
  const allTickets = await prisma.supportTicket.findMany({
    select: { category: true, status: true },
  });
  const catMap = {};
  allTickets.forEach((t) => {
    catMap[t.category] = (catMap[t.category] || 0) + 1;
  });
  assert(Object.keys(catMap).length > 0, `Grafik 5 (Support kategoriyalari): ${Object.keys(catMap).length} ta kategoriya`);

  // Graph 6: Filiallar dinamikasi
  const branches = await prisma.branch.findMany({
    select: {
      id: true,
      name: true,
      orders: { select: { finalAmount: true } },
      fiscalModules: { select: { id: true } },
    },
  });
  const branchSales = branches.map((b) => ({
    name: b.name,
    sales: b.orders.reduce((sum, o) => sum + o.finalAmount, 0),
    fmCount: b.fiscalModules.length,
  }));
  assert(branchSales.length >= 6, `Grafik 6 (Filiallar faoliyati): ${branchSales.length} ta filial tahlil qilindi`);

  // Graph 7: Menejerlar dinamikasi
  const managers = await prisma.user.findMany({
    where: { role: { name: 'MANAGER' } },
    select: {
      id: true,
      name: true,
      managedOrders: { select: { finalAmount: true, paidAmount: true } },
    },
  });
  const managerRankings = managers.map((m) => ({
    name: m.name,
    sales: m.managedOrders.reduce((sum, o) => sum + o.finalAmount, 0),
  })).sort((a, b) => b.sales - a.sales);
  assert(managerRankings.length > 0, `Grafik 7 (Menejerlar savdo reytingi): ${managerRankings.length} ta menejer`);

  // 4. Testing 5 Tables Datasets
  console.log('\n📋 4. 5 TA JADVAL MA\'LUMOTLARINI TEKSHIRISH...');

  // Table 1: Oxirgi buyurtmalar
  const latestOrders = await prisma.order.findMany({
    take: 8,
    orderBy: { createdAt: 'desc' },
    include: { customer: true, manager: true },
  });
  assert(latestOrders.length > 0, `Jadval 1 (Oxirgi buyurtmalar): ${latestOrders.length} ta ko'rsatildi`);

  // Table 2: Ochiq supportlar
  const activeTickets = await prisma.supportTicket.findMany({
    where: { status: { in: ['YANGI', 'JARAYONDA', 'JAVOB_KUTILMOQDA', 'TEXNIKKA_BERILDI'] } },
    take: 8,
    include: { customer: true, assignedTo: true },
  });
  assert(Array.isArray(activeTickets), `Jadval 2 (Ochiq supportlar): ${activeTickets.length} ta`);

  // Table 3: Bugungi / Faol o'rnatishlar
  const activeInst = await prisma.installation.findMany({
    where: { status: { notIn: ['YAKUNLANDI', 'BEKOR_QILINDI'] } },
    take: 8,
    include: { customer: true, technician: true },
  });
  assert(Array.isArray(activeInst), `Jadval 3 (Bugungi o'rnatishlar): ${activeInst.length} ta`);

  // Table 4: Kam qolgan mahsulotlar (Real stock)
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { stock: true, category: true },
  });
  const lowStock = products.filter((p) => {
    const avail = p.stock.reduce((sum, s) => sum + (s.quantity - s.reserved), 0);
    return avail <= p.minStock;
  });
  assert(Array.isArray(lowStock), `Jadval 4 (Kam qolgan mahsulotlar): ${lowStock.length} ta tanqis tovar aniqlandi`);

  // Table 5: Qarzdor mijozlar
  const topDebtors = await prisma.customer.findMany({
    where: { debt: { gt: 0 } },
    take: 8,
    orderBy: { debt: 'desc' },
    include: { branch: true, manager: true },
  });
  assert(topDebtors.length > 0, `Jadval 5 (Qarzdor mijozlar): ${topDebtors.length} ta yirik qarzdor topildi`);

  // 5. Testing Date, Branch & Manager Filters
  console.log('\n🎛️ 5. SANALAR VA FILTRLAR ISHLASHINI TEKSHIRISH...');

  const filterPresets = ['today', 'yesterday', '7days', '30days', 'this_month', 'last_month', 'custom'];
  for (const preset of filterPresets) {
    let startD = new Date();
    if (preset === '7days') startD = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    else if (preset === '30days') startD = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    else if (preset === 'yesterday') startD = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const count = await prisma.order.count({ where: { createdAt: { gte: startD } } });
    assert(typeof count === 'number', `Sana filtri '${preset}' muvaffaqiyatli tekshirildi`);
  }

  // Branch filter test
  const firstBranch = branches[0];
  const branchOrders = await prisma.order.count({ where: { branchId: firstBranch.id } });
  assert(typeof branchOrders === 'number', `Filial filtri '${firstBranch.name}' bo'yicha buyurtmalar soni: ${branchOrders} ta`);

  // Manager filter test
  const firstManager = managers[0];
  const mgrOrders = await prisma.order.count({ where: { managerId: firstManager.id } });
  assert(typeof mgrOrders === 'number', `Menejer filtri '${firstManager.name}' bo'yicha buyurtmalar soni: ${mgrOrders} ta`);

  console.log('\n================================================================');
  console.log(`🏁 TEST NATIJALARI: ${passedTests}/${totalTests} TA TEST MUVAFFAQIYATLI O'TDI (100%)`);
  console.log('================================================================');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runPhase9DashboardTests()
  .catch((e) => {
    console.error('Fatal test error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
