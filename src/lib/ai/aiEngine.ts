import {
  UserContext,
  ToolResult,
  getCustomers,
  getOrders,
  getSales,
  getPayments,
  getStock,
  getFiscalModules,
  getSupportTickets,
  getInstallations,
  getReports,
} from './aiTools';

export interface AiChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AiProcessResult {
  reply: string;
  toolsUsed: Array<{
    name: string;
    params: any;
    success: boolean;
    error?: string;
  }>;
  intent: string;
  userRole: string;
}

// Raqamlarni chiroyli formatlash: 12500000 -> 12 500 000 so'm
function formatSum(num: number): string {
  return new Intl.NumberFormat('uz-UZ').format(Math.round(num)) + " so'm";
}

export async function processAiQuery(
  user: UserContext,
  query: string,
  history: AiChatMessage[] = []
): Promise<AiProcessResult> {
  const q = query.trim().toLowerCase();
  const toolsUsed: AiProcessResult['toolsUsed'] = [];

  // 1.1 "Mening bugungi savdom"
  if (
    q.includes('mening bugungi savdom') ||
    q.includes('mening savdom') ||
    (q.includes('mening') && q.includes('savdo'))
  ) {
    const res = await getSales(user, { myOnly: true, period: 'today' });
    toolsUsed.push({ name: 'getSales', params: { myOnly: true, period: 'today' }, success: res.success, error: res.error });

    if (!res.success) {
      return { reply: `⚠️ ${res.message}`, toolsUsed, intent: 'get_my_today_sales', userRole: user.role };
    }

    const { ordersCount, totalSalesAmount, totalPaidAmount, totalDebtAmount } = res.data;
    const reply = `💼 **Hurmatli ${user.name}, sizning bugungi shaxsiy savdo hisobotingiz**:\n\n` +
      `• 🛒 **Bitimlar soni:** ${ordersCount} ta\n` +
      `• 💰 **Bugungi savdo hajmingiz:** **${formatSum(totalSalesAmount)}**\n` +
      `• 💳 **Mijozlardan qabul qilingan to'lov:** ${formatSum(totalPaidAmount)}\n` +
      `• ⏳ **Qarzdorlik qoldig'i:** ${formatSum(totalDebtAmount)}\n\n` +
      `👏 _Bugungi faoliyatingiz uchun rahmat, reja ustida ishlashda davom eting!_`;

    return { reply, toolsUsed, intent: 'get_my_today_sales', userRole: user.role };
  }

  // 1.2 "Bugungi savdo qancha?" (Admin / Umumiy)
  if (
    q.includes('bugungi savdo') ||
    q.includes('bugun qancha savdo') ||
    q.includes('bugungi tushum') ||
    (q.includes('savdo') && q.includes('bugun'))
  ) {
    const isManager = user.role === 'MANAGER';
    const res = await getSales(user, { period: 'today', myOnly: isManager });
    toolsUsed.push({ name: 'getSales', params: { period: 'today', myOnly: isManager }, success: res.success, error: res.error });

    if (!res.success) {
      return {
        reply: `⚠️ ${res.message}`,
        toolsUsed,
        intent: 'get_today_sales',
        userRole: user.role,
      };
    }

    const { ordersCount, totalSalesAmount, totalPaidAmount, totalDebtAmount, scope } = res.data;
    const reply = `📊 **Bugungi Savdo Ko'rsatkichlari** (${scope}):\n\n` +
      `• 🛒 **Buyurtmalar soni:** ${ordersCount} ta\n` +
      `• 💰 **Jami savdo hajmi:** **${formatSum(totalSalesAmount)}**\n` +
      `• 💳 **Undirilgan to'lov:** ${formatSum(totalPaidAmount)}\n` +
      `• ⏳ **Kutilayotgan qarzdorlik:** ${formatSum(totalDebtAmount)}\n\n` +
      `_${ordersCount === 0 ? "Bugun hali yangi buyurtmalar rasmiylashtirilmagan." : "Barcha savdolar real vaqt rejimida qayd etilgan."}_`;

    return { reply, toolsUsed, intent: 'get_today_sales', userRole: user.role };
  }

  // 1.2 "Bugungi foyda qancha?"
  if (
    q.includes('bugungi foyda') ||
    q.includes('foyda qancha') ||
    q.includes('sof foyda') ||
    q.includes('marja')
  ) {
    const res = await getReports(user, { type: 'profit', period: 'today' });
    toolsUsed.push({ name: 'getReports', params: { type: 'profit', period: 'today' }, success: res.success, error: res.error });

    if (!res.success) {
      return {
        reply: `🔒 **Kirish cheklangan:** ${res.message}\n\n_Ushbu moliyaviy ma'lumotlar faqat kompaniya Rahbariyati va Bosh buxgalteriya ixtiyorida saqlanadi._`,
        toolsUsed,
        intent: 'get_today_profit',
        userRole: user.role,
      };
    }

    const { ordersCount, totalRevenue, totalCostOfGoodsSold, grossProfit, marginPercentage } = res.data;
    const reply = `📈 **Bugungi Moliyaviy Foyda Tahlili (COGS/Tannarx balansi)**:\n\n` +
      `• 💵 **Kunlik umumiy tushum:** ${formatSum(totalRevenue)}\n` +
      `• 📦 **Mahsulotlar tannarxi (COGS):** ${formatSum(totalCostOfGoodsSold)}\n` +
      `• 💎 **Yalpi sof foyda:** **${formatSum(grossProfit)}**\n` +
      `• 📊 **Rentabellik (marja):** **${marginPercentage}**\n` +
      `• 📝 **Tahlil qilingan bitimlar:** ${ordersCount} ta\n\n` +
      `_Hisob-kitob sotilgan fiskal modullar, POS terminallar va ONKM apparatlari xarid narxlariga nisbatan avtomatik chiqarildi._`;

    return { reply, toolsUsed, intent: 'get_today_profit', userRole: user.role };
  }

  // 1.3 "Qaysi filialda FM kam?"
  if (
    (q.includes('filial') && q.includes('fm') && (q.includes('kam') || q.includes('yetishmaydi') || q.includes('tanqis'))) ||
    q.includes('qaysi filialda fm kam')
  ) {
    const res = await getFiscalModules(user, { lowStockOnly: true });
    toolsUsed.push({ name: 'getFiscalModules', params: { lowStockOnly: true }, success: res.success, error: res.error });

    if (!res.success) {
      return { reply: `⚠️ ${res.message}`, toolsUsed, intent: 'get_low_fm_branches', userRole: user.role };
    }

    const { branches, criticalThreshold, lowStockBranchesCount } = res.data;

    if (branches.length === 0) {
      return {
        reply: `✅ **Ajoyib xabar!** Hozirda barcha filiallarda Fiskal Modullar (FM) zaxirasi yetarli (kamida ${criticalThreshold} tadan ko'p). Hech qaysi filialda tanqislik yo'q.`,
        toolsUsed,
        intent: 'get_low_fm_branches',
        userRole: user.role,
      };
    }

    let branchLines = branches
      .map((b: any) => `• 📍 **${b.branchName}** (${b.branchCode}): **${b.availableCount} ta** mavjud (Zaxirada: ${b.reservedCount} ta)`)
      .join('\n');

    const reply = `⚠️ **Fiskal Modullar (FM) kam qolgan filiallar ro'yxati** (Kritik me'yor: < ${criticalThreshold} ta):\n\n` +
      `${branchLines}\n\n` +
      `💡 **Tavsiya:** Ushbu ${lowStockBranchesCount} ta filialga zudlik bilan bosh ombordan yangi partiya FM o'tkazishni (transfer) tavsiya qilaman.`;

    return { reply, toolsUsed, intent: 'get_low_fm_branches', userRole: user.role };
  }

  // 1.4 "Qaysi mahsulot kam qolgan?" yoki "Qaysi mahsulot kamaygan?"
  if (
    q.includes('kam qolgan') ||
    q.includes('kamaygan') ||
    q.includes('mahsulot kam') ||
    q.includes('tanqis tovar') ||
    q.includes('qaysi mahsulot kam')
  ) {
    const res = await getStock(user, { isLowStock: true });
    toolsUsed.push({ name: 'getStock', params: { isLowStock: true }, success: res.success, error: res.error });

    if (!res.success) {
      return { reply: `⚠️ ${res.message}`, toolsUsed, intent: 'get_low_stock_products', userRole: user.role };
    }

    const { products, count } = res.data;

    if (products.length === 0) {
      return {
        reply: `✅ **Omborda tanqislik yo'q!** Barcha faol mahsulotlar minimal me'yordan (minStock) ortiq miqdorda mavjud.`,
        toolsUsed,
        intent: 'get_low_stock_products',
        userRole: user.role,
      };
    }

    let prodLines = products
      .slice(0, 10)
      .map((p: any) => `• 📦 **${p.name}** [${p.sku}] — Mavjud: **${p.available} dona** (Min me'yor: ${p.minStock}, Rezervda: ${p.reserved})`)
      .join('\n');

    const reply = `🔔 **Omborda zaxirasi kam qolgan mahsulotlar** (Jami: ${count} ta):\n\n` +
      `${prodLines}\n\n` +
      `💡 _Ushbu mahsulotlar bo'yicha yetkazib beruvchilar bilan yangi xarid partiyasini shakllantirish kerak._`;

    return { reply, toolsUsed, intent: 'get_low_stock_products', userRole: user.role };
  }

  // 1.5 "Ochiq supportlar nechta?"
  if (
    q.includes('ochiq support') ||
    q.includes('ochiq ticket') ||
    q.includes('murojaatlar nechta') ||
    (q.includes('support') && q.includes('nechta'))
  ) {
    const res = await getSupportTickets(user, { status: 'open' });
    toolsUsed.push({ name: 'getSupportTickets', params: { status: 'open' }, success: res.success, error: res.error });

    if (!res.success) {
      return { reply: `⚠️ ${res.message}`, toolsUsed, intent: 'get_open_support_count', userRole: user.role };
    }

    const { totalCount, tickets } = res.data;

    let ticketSnippets = tickets.slice(0, 5).map((t: any) =>
      `  - **#${t.ticketNumber}** (${t.category}): ${t.customer?.companyName || t.customer?.name} — _"${t.issue.substring(0, 45)}..."_ [${t.priority}]`
    ).join('\n');

    const reply = `🎫 **Ayni paytda ochiq support murojaatlari:** **${totalCount} ta**\n\n` +
      (tickets.length > 0 ? `Oxirgi faol murojaatlar:\n${ticketSnippets}\n\n` : '') +
      `📌 Holat: Murojaatlarning barchasi navbatda yoki texnik xodimlarga yo'naltirilgan.`;

    return { reply, toolsUsed, intent: 'get_open_support_count', userRole: user.role };
  }

  // 1.6 "Qaysi menejerning savdosi qancha?"
  if (
    q.includes('menejerning savdosi') ||
    q.includes('menejerlar savdosi') ||
    q.includes('qaysi menejer') ||
    (q.includes('menejer') && q.includes('savdo'))
  ) {
    if (user.role !== 'ADMIN') {
      return {
        reply: `🔒 **Ruxsat cheklangan:** Menejerlararo savdo reytingi va qiyosiy hisobotini ko'rish faqat Administrator uchun ruxsat etilgan.`,
        toolsUsed: [{ name: 'getSales', params: { byManager: true }, success: false, error: 'PERMISSION_DENIED' }],
        intent: 'get_manager_sales_breakdown',
        userRole: user.role,
      };
    }

    const res = await getSales(user, { byManager: true });
    toolsUsed.push({ name: 'getSales', params: { byManager: true }, success: res.success, error: res.error });

    if (!res.success) {
      return { reply: `⚠️ ${res.message}`, toolsUsed, intent: 'get_manager_sales_breakdown', userRole: user.role };
    }

    const { managerBreakdown } = res.data;

    let lines = managerBreakdown.map((m: any, idx: number) => {
      const medals = ['🥇', '🥈', '🥉'];
      const prefix = medals[idx] || `👤 ${idx + 1}.`;
      return `${prefix} **${m.managerName}**\n` +
        `   • Savdo: **${formatSum(m.totalSales)}** (${m.ordersCount} ta buyurtma)\n` +
        `   • Undirilgan: ${formatSum(m.collectedPayments)}`;
    }).join('\n\n');

    const reply = `🏆 **Menejerlar bo'yicha savdo ko'rsatkichlari reytingi**:\n\n` +
      `${lines}\n\n` +
      `_Tizim eng yuqori ko'rsatkich qayd etgan menejerlarni saralab chiqardi._`;

    return { reply, toolsUsed, intent: 'get_manager_sales_breakdown', userRole: user.role };
  }

  // 2. MENEJER INTENTS
  // 2.1 "Mening mijozlarim"
  if (
    q.includes('mening mijozlarim') ||
    q.includes('mijozlarim') ||
    (user.role === 'MANAGER' && q.includes('mijoz'))
  ) {
    const res = await getCustomers(user, { myOnly: true, limit: 10 });
    toolsUsed.push({ name: 'getCustomers', params: { myOnly: true }, success: res.success, error: res.error });

    if (!res.success) {
      return { reply: `⚠️ ${res.message}`, toolsUsed, intent: 'get_my_customers', userRole: user.role };
    }

    const { totalCount, customers, scope } = res.data;

    let list = customers.map((c: any) =>
      `• 🏢 **${c.companyName || c.name}** (STIR: ${c.inn})\n` +
      `  📞 Tel: ${c.phone} | Balans: ${formatSum(c.balance || 0)} | Qarz: ${formatSum(c.debt || 0)}`
    ).join('\n');

    const reply = `👥 **${scope}** (Jami: ${totalCount} ta):\n\n` +
      `${list}\n\n` +
      `_Barcha mijozlar faol holatda va monitoringda._`;

    return { reply, toolsUsed, intent: 'get_my_customers', userRole: user.role };
  }

  // 2.2 "Mening buyurtmalarim"
  if (
    q.includes('mening buyurtmalarim') ||
    q.includes('buyurtmalarim') ||
    (user.role === 'MANAGER' && q.includes('buyurtma'))
  ) {
    const res = await getOrders(user, { myOnly: true, limit: 10 });
    toolsUsed.push({ name: 'getOrders', params: { myOnly: true }, success: res.success, error: res.error });

    if (!res.success) {
      return { reply: `⚠️ ${res.message}`, toolsUsed, intent: 'get_my_orders', userRole: user.role };
    }

    const { totalCount, orders, scope } = res.data;

    let list = orders.map((o: any) =>
      `• 🛒 **Buyurtma #${o.orderNumber}** — **${formatSum(o.totalAmount)}**\n` +
      `  Mijoz: ${o.customer?.companyName || o.customer?.name} | Etap: **${o.pipelineStage}** | Holat: ${o.status}`
    ).join('\n');

    const reply = `📦 **${scope}** (Jami: ${totalCount} ta):\n\n` +
      `${list}\n\n` +
      `_Buyurtma bo'yicha to'lovlar va o'rnatish jarayonlari boshqaruvda._`;

    return { reply, toolsUsed, intent: 'get_my_orders', userRole: user.role };
  }

  // 2.3 "Mening bugungi savdom"
  if (
    q.includes('mening bugungi savdom') ||
    q.includes('mening savdom')
  ) {
    const res = await getSales(user, { myOnly: true, period: 'today' });
    toolsUsed.push({ name: 'getSales', params: { myOnly: true, period: 'today' }, success: res.success, error: res.error });

    if (!res.success) {
      return { reply: `⚠️ ${res.message}`, toolsUsed, intent: 'get_my_today_sales', userRole: user.role };
    }

    const { ordersCount, totalSalesAmount, totalPaidAmount, totalDebtAmount } = res.data;
    const reply = `💼 **Hurmatli ${user.name}, sizning bugungi shaxsiy savdo hisobotingiz**:\n\n` +
      `• 🛒 **Bitimlar soni:** ${ordersCount} ta\n` +
      `• 💰 **Bugungi savdo hajmingiz:** **${formatSum(totalSalesAmount)}**\n` +
      `• 💳 **Mijozlardan qabul qilingan to'lov:** ${formatSum(totalPaidAmount)}\n` +
      `• ⏳ **Qarzdorlik qoldig'i:** ${formatSum(totalDebtAmount)}\n\n` +
      `👏 _Bugungi faoliyatingiz uchun rahmat, reja ustida ishlashda davom eting!_`;

    return { reply, toolsUsed, intent: 'get_my_today_sales', userRole: user.role };
  }

  // 2.4 "Mening vazifalarim"
  if (
    q.includes('mening vazifalarim') ||
    q.includes('vazifalarim') ||
    (user.role === 'TECHNICIAN' && (q.includes('vazifa') || q.includes('ishlarim')))
  ) {
    const res = await getInstallations(user, { myOnly: true, limit: 10 });
    toolsUsed.push({ name: 'getInstallations', params: { myOnly: true }, success: res.success, error: res.error });

    if (!res.success) {
      return { reply: `⚠️ ${res.message}`, toolsUsed, intent: 'get_my_tasks', userRole: user.role };
    }

    const { totalCount, installations, scope } = res.data;

    if (installations.length === 0) {
      return {
        reply: `✅ **Vazifalar topilmadi:** Ayni damda sizga biriktirilgan faol o'rnatish yoki servis vazifalari mavjud emas.`,
        toolsUsed,
        intent: 'get_my_tasks',
        userRole: user.role,
      };
    }

    let list = installations.map((i: any) =>
      `• 🛠 **Vazifa #${i.taskNumber}** — ${i.deviceName} (${i.serviceType})\n` +
      `  Mijoz: ${i.customer?.companyName || i.customer?.name} | Manzil: ${i.location || 'Filial'} | Holat: **${i.status}**`
    ).join('\n');

    const reply = `📋 **${scope}** (Jami: ${totalCount} ta):\n\n` +
      `${list}\n\n` +
      `_Vazifa holatini mobil texnik panelidan boshqarishingiz mumkin._`;

    return { reply, toolsUsed, intent: 'get_my_tasks', userRole: user.role };
  }

  // 2.5 "Mening supportlarim"
  if (
    q.includes('mening supportlarim') ||
    q.includes('mening ticketlarim')
  ) {
    const res = await getSupportTickets(user, { myOnly: true, limit: 10 });
    toolsUsed.push({ name: 'getSupportTickets', params: { myOnly: true }, success: res.success, error: res.error });

    if (!res.success) {
      return { reply: `⚠️ ${res.message}`, toolsUsed, intent: 'get_my_tickets', userRole: user.role };
    }

    const { totalCount, tickets } = res.data;

    if (tickets.length === 0) {
      return {
        reply: `✅ Sizga biriktirilgan faol murojaatlar mavjud emas. Barcha so'rovlar muvaffaqiyatli yopilgan.`,
        toolsUsed,
        intent: 'get_my_tickets',
        userRole: user.role,
      };
    }

    let list = tickets.map((t: any) =>
      `• 🎫 **#${t.ticketNumber}** [${t.category}] — ${t.issue}\n` +
      `  Mijoz: ${t.customer?.companyName || t.customer?.name} | Ustuvorlik: ${t.priority} | Holat: **${t.status}**`
    ).join('\n');

    const reply = `🎫 **Sizga tegishli support murojaatlari** (Jami: ${totalCount} ta):\n\n` +
      `${list}\n\n` +
      `_Mijozlar bilan bog'lanish va masalani hal etish nazoratda._`;

    return { reply, toolsUsed, intent: 'get_my_tickets', userRole: user.role };
  }

  // 3. OMBORCHI INTENTS
  // 3.1 "FM qoldig'i qancha?"
  if (
    q.includes('fm qoldig') ||
    q.includes('fiskal modul qoldiq') ||
    q.includes('fiskal modullar soni') ||
    q.includes('fm soni')
  ) {
    const res = await getFiscalModules(user, { summary: true });
    toolsUsed.push({ name: 'getFiscalModules', params: { summary: true }, success: res.success, error: res.error });

    if (!res.success) {
      return { reply: `⚠️ ${res.message}`, toolsUsed, intent: 'get_fm_balance', userRole: user.role };
    }

    const { totalAvailableAcrossSystem, totalReservedAcrossSystem, branches } = res.data;

    let branchDetails = branches.map((b: any) =>
      `• 📍 **${b.branchName}**: **${b.availableCount} ta** mavjud (Rezervda: ${b.reservedCount}, O'rnatilgan: ${b.installedCount})`
    ).join('\n');

    const reply = `📟 **Fiskal Modullar (FM) Tizim Bo'yicha Qoldig'i**:\n\n` +
      `• 🟢 **Respublika bo'yicha jami mavjud:** **${totalAvailableAcrossSystem} dona**\n` +
      `• 🟡 **Mijozlar uchun rezerv qilingan:** ${totalReservedAcrossSystem} dona\n\n` +
      `**Filiallar kesimida qoldiq:**\n` +
      `${branchDetails}\n\n` +
      `_Barcha FM seriya raqamlari DSI (Davlat Soliq Qo'mitasi) integratsiyasiga tayyor holatda saqlanmoqda._`;

    return { reply, toolsUsed, intent: 'get_fm_balance', userRole: user.role };
  }

  // 3.2 "Qaysi filialda mahsulot bor?"
  if (
    (q.includes('qaysi filial') && q.includes('mahsulot')) ||
    q.includes('qaysi filialda mahsulot bor') ||
    q.includes('filiallarda mahsulot')
  ) {
    const res = await getStock(user, {});
    toolsUsed.push({ name: 'getStock', params: {}, success: res.success, error: res.error });

    if (!res.success) {
      return { reply: `⚠️ ${res.message}`, toolsUsed, intent: 'get_products_by_branch', userRole: user.role };
    }

    const { products } = res.data;

    // Har bir mahsulot bo'yicha qaysi filialda nechtadan borligini xulosa qilamiz
    let list = products.slice(0, 8).map((p: any) => {
      const branchesWithStock = p.branches.filter((b: any) => b.available > 0);
      const branchStr = branchesWithStock.length > 0
        ? branchesWithStock.map((b: any) => `${b.branchName}: ${b.available} ta`).join(', ')
        : "Hozirda hech qaysi filialda yo'q";
      return `• 📦 **${p.name}** [${p.sku}]:\n  ${branchStr}`;
    }).join('\n\n');

    const reply = `🏢 **Filiallar bo'yicha mahsulotlar taqsimoti:**\n\n` +
      `${list}\n\n` +
      `💡 _Bir filialdan ikkinchisiga o'tkazish uchun "Ombor & Qurilmalar" bo'limida transfer amaliyotidan foydalaning._`;

    return { reply, toolsUsed, intent: 'get_products_by_branch', userRole: user.role };
  }

  // 4. SUPPORT INTENTS
  // 4.1 "Kechikkan ticketlar"
  if (
    q.includes('kechikkan ticket') ||
    q.includes('kechikkan support') ||
    q.includes('kechikkan murojaat') ||
    q.includes('kechikkanlar')
  ) {
    const res = await getSupportTickets(user, { overdue: true, limit: 10 });
    toolsUsed.push({ name: 'getSupportTickets', params: { overdue: true }, success: res.success, error: res.error });

    if (!res.success) {
      return { reply: `⚠️ ${res.message}`, toolsUsed, intent: 'get_overdue_tickets', userRole: user.role };
    }

    const { totalCount, tickets } = res.data;

    if (totalCount === 0) {
      return {
        reply: `🎉 **Ajoyib natija!** Ayni damda 24 soatdan ortiq kechikkan birorta ham ochiq ticket yo'q. Barcha murojaatlar o'z vaqtida ko'rib chiqilmoqda.`,
        toolsUsed,
        intent: 'get_overdue_tickets',
        userRole: user.role,
      };
    }

    let list = tickets.map((t: any) =>
      `• ⚠️ **#${t.ticketNumber}** (${t.category}) — Mijoz: ${t.customer?.companyName || t.customer?.name}\n` +
      `  Muammo: _"${t.issue}"_ | Holat: **${t.status}** | Operator: ${t.assignedTo?.name || "Biriktirilmagan"}`
    ).join('\n');

    const reply = `🚨 **Diqqat! Muddati kechikkan ticketlar** (24+ soatdan beri ochiq: ${totalCount} ta):\n\n` +
      `${list}\n\n` +
      `⚡ **Tavsiya:** Ushbu murojaatlarga ustuvorlik berib, mijozlar bilan tezkor bog'lanish zarur.`;

    return { reply, toolsUsed, intent: 'get_overdue_tickets', userRole: user.role };
  }

  // 4.2 "Bugungi ticketlar"
  if (
    q.includes('bugungi ticket') ||
    q.includes('bugungi murojaat') ||
    q.includes('bugun ochilgan ticket')
  ) {
    const res = await getSupportTickets(user, { period: 'today', limit: 10 });
    toolsUsed.push({ name: 'getSupportTickets', params: { period: 'today' }, success: res.success, error: res.error });

    if (!res.success) {
      return { reply: `⚠️ ${res.message}`, toolsUsed, intent: 'get_today_tickets', userRole: user.role };
    }

    const { totalCount, tickets } = res.data;

    if (totalCount === 0) {
      return {
        reply: `ℹ️ Bugun hali yangi support murojaatlari kelib tushmadi.`,
        toolsUsed,
        intent: 'get_today_tickets',
        userRole: user.role,
      };
    }

    let list = tickets.map((t: any) =>
      `• 🎫 **#${t.ticketNumber}** [${t.category}] — ${t.customer?.companyName || t.customer?.name} (${t.priority})\n` +
      `  Muammo: ${t.issue} | Holat: **${t.status}**`
    ).join('\n');

    const reply = `📅 **Bugun kelib tushgan support murojaatlari** (Jami: ${totalCount} ta):\n\n` +
      `${list}\n\n` +
      `_Murojaatlar qabul qilinib, ish jarayoniga kiritilgan._`;

    return { reply, toolsUsed, intent: 'get_today_tickets', userRole: user.role };
  }

  // 5. TO'LOVLAR HAQIDA SO'ROV (FINANCE)
  if (
    q.includes('to\'lov') ||
    q.includes('tolov') ||
    q.includes('kassa') ||
    q.includes('tushumlar')
  ) {
    const res = await getPayments(user, { period: 'today' });
    toolsUsed.push({ name: 'getPayments', params: { period: 'today' }, success: res.success, error: res.error });

    if (!res.success) {
      return {
        reply: `🔒 ${res.message}`,
        toolsUsed,
        intent: 'get_payments',
        userRole: user.role,
      };
    }

    const { totalCount, totalCollected, byMethod } = res.data;
    const methodsList = Object.entries(byMethod)
      .map(([m, val]) => `• ${m}: ${formatSum(val as number)}`)
      .join('\n');

    const reply = `💳 **Bugungi To'lovlar va Kassa Holati**:\n\n` +
      `• 📝 **Tranzaksiyalar soni:** ${totalCount} ta\n` +
      `• 💰 **Jami qabul qilingan summa:** **${formatSum(totalCollected)}**\n\n` +
      `**To'lov usullari bo'yicha:**\n${methodsList || "Bugun hali to'lov tushmagan"}`;

    return { reply, toolsUsed, intent: 'get_payments', userRole: user.role };
  }

  // 6. DEFAULT FALLBACK / SALOMLASHISH / YORDAM
  let roleSuggestions = '';
  if (user.role === 'ADMIN') {
    roleSuggestions =
      `• "Bugungi savdo qancha?"\n` +
      `• "Bugungi foyda qancha?"\n` +
      `• "Qaysi filialda FM kam?"\n` +
      `• "Qaysi mahsulot kam qolgan?"\n` +
      `• "Ochiq supportlar nechta?"\n` +
      `• "Qaysi menejerning savdosi qancha?"`;
  } else if (user.role === 'MANAGER') {
    roleSuggestions =
      `• "Mening mijozlarim"\n` +
      `• "Mening buyurtmalarim"\n` +
      `• "Mening bugungi savdom"\n` +
      `• "Mening vazifalarim"\n` +
      `• "Mening supportlarim"`;
  } else if (user.role === 'WAREHOUSE') {
    roleSuggestions =
      `• "Qaysi mahsulot kamaygan?"\n` +
      `• "FM qoldig'i qancha?"\n` +
      `• "Qaysi filialda mahsulot bor?"`;
  } else if (user.role === 'SUPPORT') {
    roleSuggestions =
      `• "Mening ticketlarim"\n` +
      `• "Kechikkan ticketlar"\n` +
      `• "Bugungi ticketlar"`;
  } else {
    roleSuggestions =
      `• "Mening vazifalarim"\n` +
      `• "Qurilmalar holati"`;
  }

  const reply = `Salom, **${user.name}**! Men ONKM Business ERP aqlli yordamchisiman.\n\n` +
    `Sizning rolingiz: **${user.roleDisplayName || user.role}**.\n\n` +
    `Siz quyidagi savollar orqali tezkor tahlil olishingiz mumkin:\n\n` +
    `${roleSuggestions}\n\n` +
    `Qanday ma'lumot kerak bo'lsa, bemalol so'rang!`;

  return {
    reply,
    toolsUsed,
    intent: 'general_help',
    userRole: user.role,
  };
}
