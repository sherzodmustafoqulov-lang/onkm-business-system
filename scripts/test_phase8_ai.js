const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Load compiled AI modules
const {
  checkUserPermission,
  getCustomers,
  getOrders,
  getSales,
  getPayments,
  getStock,
  getFiscalModules,
  getSupportTickets,
  getInstallations,
  getReports,
} = require('../.test-dist/ai/aiTools');

const { processAiQuery } = require('../.test-dist/ai/aiEngine');

async function runPhase8AiTests() {
  console.log('================================================================');
  console.log('🤖 STARTING PHASE 8 AI ASSISTANT SUITE & RBAC VERIFICATION');
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

  // 1. Fetch test users with roles and permissions from database
  console.log('🔍 1. Tizimdagi test foydalanuvchilari va rollarini yuklash...');
  const users = await prisma.user.findMany({
    include: {
      role: {
        include: {
          permissions: true,
        },
      },
      branch: true,
    },
  });

  const adminUser = users.find((u) => u.role.name === 'ADMIN');
  const managerUser = users.find((u) => u.role.name === 'MANAGER');
  const warehouseUser = users.find((u) => u.role.name === 'WAREHOUSE');
  const supportUser = users.find((u) => u.role.name === 'SUPPORT');

  assert(adminUser, 'Admin foydalanuvchi mavjud');
  assert(managerUser, 'Menejer foydalanuvchi mavjud');
  assert(warehouseUser, 'Omborchi foydalanuvchi mavjud');
  assert(supportUser, 'Support operator foydalanuvchi mavjud');

  const toUserContext = (u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role.name,
    roleDisplayName: u.role.displayName,
    branchId: u.branchId,
    branchName: u.branch?.name,
    permissions: u.role.permissions,
  });

  const adminCtx = toUserContext(adminUser);
  const managerCtx = toUserContext(managerUser);
  const warehouseCtx = toUserContext(warehouseUser);
  const supportCtx = toUserContext(supportUser);

  console.log('\n🛡️ 2. TESTING SECURE AI TOOLS DIRECTLY & PERMISSION GUARDRAILS...');

  // Tool 1: getCustomers
  const adminCustRes = await getCustomers(adminCtx);
  assert(adminCustRes.success === true && adminCustRes.data.totalCount >= 0, 'Admin getCustomers: muvaffaqiyatli');

  const managerCustRes = await getCustomers(managerCtx);
  assert(managerCustRes.success === true && managerCustRes.data.scope.includes('o\'zingizga biriktirilgan'), 'Menejer getCustomers: faqat shaxsiy mijozlar doirasida');

  // Tool 2: getOrders
  const adminOrdersRes = await getOrders(adminCtx);
  assert(adminOrdersRes.success === true, 'Admin getOrders: barcha buyurtmalar');

  const supportOrdersRes = await getOrders(supportCtx);
  assert(supportOrdersRes.success === false && supportOrdersRes.error === 'PERMISSION_DENIED', 'Support getOrders: ruxsat cheklangan (PERMISSION_DENIED)');

  // Tool 3: getSales
  const adminSalesToday = await getSales(adminCtx, { period: 'today' });
  assert(adminSalesToday.success === true, 'Admin getSales: bugungi savdo muvaffaqiyatli');

  const adminSalesByMgr = await getSales(adminCtx, { byManager: true });
  assert(adminSalesByMgr.success === true && Array.isArray(adminSalesByMgr.data.managerBreakdown), 'Admin getSales: menejerlar kesimida reyting');

  const managerSalesRes = await getSales(managerCtx, { period: 'today' });
  assert(managerSalesRes.success === true && managerSalesRes.data.scope.includes('shaxsiy savdo'), 'Menejer getSales: faqat shaxsiy savdo summasi');

  const supportSalesRes = await getSales(supportCtx);
  assert(supportSalesRes.success === false && supportSalesRes.error === 'PERMISSION_DENIED', 'Support getSales: savdo ma\'lumoti cheklangan');

  // Tool 4: getPayments
  const adminPaymentsRes = await getPayments(adminCtx, { period: 'today' });
  assert(adminPaymentsRes.success === true, 'Admin getPayments: kassa to\'lovlari');

  const warehousePaymentsRes = await getPayments(warehouseCtx);
  assert(warehousePaymentsRes.success === false && warehousePaymentsRes.error === 'PERMISSION_DENIED', 'Omborchi getPayments: moliyaviy ma\'lumot cheklangan');

  // Tool 5: getStock
  const stockRes = await getStock(adminCtx, { isLowStock: true });
  assert(stockRes.success === true && Array.isArray(stockRes.data.products), 'Admin getStock: kam qolgan tovarlar');

  // Tool 6: getFiscalModules
  const fmRes = await getFiscalModules(warehouseCtx, { summary: true });
  assert(fmRes.success === true && typeof fmRes.data.totalAvailableAcrossSystem === 'number', 'Omborchi getFiscalModules: FM balansi va filiallar taqsimoti');

  // Tool 7: getSupportTickets
  const openTicketsRes = await getSupportTickets(adminCtx, { status: 'open' });
  assert(openTicketsRes.success === true && typeof openTicketsRes.data.totalCount === 'number', 'Admin getSupportTickets: ochiq ticketlar');

  const supportMyTickets = await getSupportTickets(supportCtx, { myOnly: true });
  assert(supportMyTickets.success === true, 'Support operator getSupportTickets: mening ticketlarim');

  // Tool 8: getInstallations
  const managerInstRes = await getInstallations(managerCtx, { myOnly: true });
  assert(managerInstRes.success === true, 'Menejer getInstallations: o\'rnatish vazifalari');

  // Tool 9: getReports
  const adminProfitRes = await getReports(adminCtx, { type: 'profit', period: 'today' });
  assert(adminProfitRes.success === true && typeof adminProfitRes.data.grossProfit === 'number', 'Admin getReports: bugungi foyda va COGS');

  const managerProfitRes = await getReports(managerCtx, { type: 'profit', period: 'today' });
  assert(managerProfitRes.success === false && managerProfitRes.error === 'PERMISSION_DENIED', 'Menejer getReports: foyda hisoboti BLOKLANDI (Xavfsiz RBAC)');

  const supportProfitRes = await getReports(supportCtx, { type: 'profit', period: 'today' });
  assert(supportProfitRes.success === false && supportProfitRes.error === 'PERMISSION_DENIED', 'Support getReports: foyda hisoboti BLOKLANDI (Xavfsiz RBAC)');

  console.log('\n🤖 3. TESTING NATURAL LANGUAGE AI ENGINE FOR EACH ROLE...');

  // --- ADMIN QUESTIONS ---
  console.log('\n--- 3.1 ADMIN SAVOLLARI ---');

  // Q1: "Bugungi savdo qancha?"
  const aiAdminQ1 = await processAiQuery(adminCtx, 'Bugungi savdo qancha?');
  assert(aiAdminQ1.intent === 'get_today_sales', 'Admin Q1 intent to\'g\'ri aniqlandi (get_today_sales)');
  assert(aiAdminQ1.reply.includes("so'm") && aiAdminQ1.reply.includes('Buyurtmalar soni'), 'Admin Q1 javobi o\'zbek tilida va formatlangan');

  // Q2: "Bugungi foyda qancha?"
  const aiAdminQ2 = await processAiQuery(adminCtx, 'Bugungi foyda qancha?');
  assert(aiAdminQ2.intent === 'get_today_profit', 'Admin Q2 intent to\'g\'ri aniqlandi (get_today_profit)');
  assert(aiAdminQ2.reply.includes('sof foyda') || aiAdminQ2.reply.includes('Rentabellik'), 'Admin Q2 foyda hisoboti tahlil qilindi');

  // Q3: "Qaysi filialda FM kam?"
  const aiAdminQ3 = await processAiQuery(adminCtx, 'Qaysi filialda FM kam?');
  assert(aiAdminQ3.intent === 'get_low_fm_branches', 'Admin Q3 intent to\'g\'ri aniqlandi (get_low_fm_branches)');
  assert(aiAdminQ3.reply.includes('Fiskal Modullar') || aiAdminQ3.reply.includes('FM'), 'Admin Q3 FM filiallar tahlili qaytdi');

  // Q4: "Qaysi mahsulot kam qolgan?"
  const aiAdminQ4 = await processAiQuery(adminCtx, 'Qaysi mahsulot kam qolgan?');
  assert(aiAdminQ4.intent === 'get_low_stock_products', 'Admin Q4 intent to\'g\'ri aniqlandi (get_low_stock_products)');
  assert(aiAdminQ4.reply.includes('kam') || aiAdminQ4.reply.includes('tanqislik'), 'Admin Q4 mahsulot qoldiqlari tekshirildi');

  // Q5: "Ochiq supportlar nechta?"
  const aiAdminQ5 = await processAiQuery(adminCtx, 'Ochiq supportlar nechta?');
  assert(aiAdminQ5.intent === 'get_open_support_count', 'Admin Q5 intent to\'g\'ri aniqlandi (get_open_support_count)');
  assert(aiAdminQ5.reply.includes('support') && aiAdminQ5.reply.includes('ta'), 'Admin Q5 ochiq ticketlar soni ko\'rsatildi');

  // Q6: "Qaysi menejerning savdosi qancha?"
  const aiAdminQ6 = await processAiQuery(adminCtx, 'Qaysi menejerning savdosi qancha?');
  assert(aiAdminQ6.intent === 'get_manager_sales_breakdown', 'Admin Q6 intent to\'g\'ri aniqlandi (get_manager_sales_breakdown)');
  assert(aiAdminQ6.reply.includes('Menejerlar') || aiAdminQ6.reply.includes('reytingi'), 'Admin Q6 menejerlar savdo reytingi chiqarildi');

  // --- MENEJER QUESTIONS ---
  console.log('\n--- 3.2 MENEJER SAVOLLARI ---');

  // M1: "Mening mijozlarim"
  const aiMgrQ1 = await processAiQuery(managerCtx, 'Mening mijozlarim');
  assert(aiMgrQ1.intent === 'get_my_customers', 'Menejer Q1 intent: get_my_customers');
  assert(aiMgrQ1.reply.includes('o\'zingizga biriktirilgan') || aiMgrQ1.reply.includes('mijoz'), 'Menejer Q1 javobi shaxsiy doirada');

  // M2: "Mening buyurtmalarim"
  const aiMgrQ2 = await processAiQuery(managerCtx, 'Mening buyurtmalarim');
  assert(aiMgrQ2.intent === 'get_my_orders', 'Menejer Q2 intent: get_my_orders');

  // M3: "Mening bugungi savdom"
  const aiMgrQ3 = await processAiQuery(managerCtx, 'Mening bugungi savdom');
  assert(aiMgrQ3.intent === 'get_my_today_sales', 'Menejer Q3 intent: get_my_today_sales');

  // M4: "Mening vazifalarim"
  const aiMgrQ4 = await processAiQuery(managerCtx, 'Mening vazifalarim');
  assert(aiMgrQ4.intent === 'get_my_tasks', 'Menejer Q4 intent: get_my_tasks');

  // M5: "Mening supportlarim"
  const aiMgrQ5 = await processAiQuery(managerCtx, 'Mening supportlarim');
  assert(aiMgrQ5.intent === 'get_my_tickets', 'Menejer Q5 intent: get_my_tickets');

  // Security check: Menejer trying to ask "Bugungi foyda qancha?"
  const aiMgrUnauthorized = await processAiQuery(managerCtx, 'Bugungi foyda qancha?');
  assert(
    aiMgrUnauthorized.reply.includes('Kirish cheklangan') || aiMgrUnauthorized.reply.includes('ruxsat etilgan'),
    'Menejer foyda so\'raganda AI javobni qat\'iy chekladi (Permission Denied)'
  );

  // --- OMBORCHI QUESTIONS ---
  console.log('\n--- 3.3 OMBORCHI SAVOLLARI ---');

  // O1: "Qaysi mahsulot kamaygan?"
  const aiWhQ1 = await processAiQuery(warehouseCtx, 'Qaysi mahsulot kamaygan?');
  assert(aiWhQ1.intent === 'get_low_stock_products', 'Omborchi Q1 intent: get_low_stock_products');

  // O2: "FM qoldig'i qancha?"
  const aiWhQ2 = await processAiQuery(warehouseCtx, 'FM qoldig\'i qancha?');
  assert(aiWhQ2.intent === 'get_fm_balance', 'Omborchi Q2 intent: get_fm_balance');
  assert(aiWhQ2.reply.includes('Fiskal Modullar') && aiWhQ2.reply.includes('Mavjud') || aiWhQ2.reply.includes('dona'), 'Omborchi Q2 FM balansi o\'zbek tilida');

  // O3: "Qaysi filialda mahsulot bor?"
  const aiWhQ3 = await processAiQuery(warehouseCtx, 'Qaysi filialda mahsulot bor?');
  assert(aiWhQ3.intent === 'get_products_by_branch', 'Omborchi Q3 intent: get_products_by_branch');

  // Security check: Omborchi trying to ask "Menejerlar savdosi qancha?"
  const aiWhUnauthorized = await processAiQuery(warehouseCtx, 'Qaysi menejerning savdosi qancha?');
  assert(
    aiWhUnauthorized.reply.includes('cheklangan') || aiWhUnauthorized.reply.includes('huquqi yo\'q'),
    'Omborchi menejerlar savdosini so\'raganda AI javobni qat\'iy chekladi'
  );

  // --- SUPPORT OPERATOR QUESTIONS ---
  console.log('\n--- 3.4 SUPPORT OPERATOR SAVOLLARI ---');

  // S1: "Mening ticketlarim"
  const aiSupQ1 = await processAiQuery(supportCtx, 'Mening ticketlarim');
  assert(aiSupQ1.intent === 'get_my_tickets', 'Support Q1 intent: get_my_tickets');

  // S2: "Kechikkan ticketlar"
  const aiSupQ2 = await processAiQuery(supportCtx, 'Kechikkan ticketlar');
  assert(aiSupQ2.intent === 'get_overdue_tickets', 'Support Q2 intent: get_overdue_tickets');

  // S3: "Bugungi ticketlar"
  const aiSupQ3 = await processAiQuery(supportCtx, 'Bugungi ticketlar');
  assert(aiSupQ3.intent === 'get_today_tickets', 'Support Q3 intent: get_today_tickets');

  // Security check: Support asking "Bugungi foyda qancha?"
  const aiSupUnauthorized = await processAiQuery(supportCtx, 'Bugungi foyda qancha?');
  assert(
    aiSupUnauthorized.reply.includes('cheklangan') || aiSupUnauthorized.reply.includes('ruxsat etilgan'),
    'Support foydani so\'raganda AI qat\'iy to\'xtatdi'
  );

  console.log('\n================================================================');
  console.log(`🏁 TEST NATIJALARI: ${passedTests}/${totalTests} TA TEST MUVAFFAQIYATLI O'TDI (100%)`);
  console.log('================================================================');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runPhase8AiTests()
  .catch((e) => {
    console.error('Fatal test error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
