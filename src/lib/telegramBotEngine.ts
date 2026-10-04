// src/lib/telegramBotEngine.ts
// Production-ready state machine and message dispatcher for ONKM Telegram Bot

import prisma from './prisma';
import { sendTelegramMessage, notifySupportOperators } from './telegram';

// In-memory session store for multi-step bot flows (can also be backed by DB)
const userSessions: Map<string, {
  step: string;
  customerId?: string;
  tempCategory?: string;
  tempDevice?: string;
  tempIssue?: string;
}> = new Map();

// Main Menu Reply Keyboard
export const MAIN_MENU_KEYBOARD = {
  keyboard: [
    [{ text: '🏢 Mening kompaniyam' }, { text: '🖥 Mening qurilmalarim' }],
    [{ text: '🛒 Buyurtmalarim' }, { text: '💳 To\'lovlarim' }],
    [{ text: '🛠 Kafolat' }, { text: '🎫 Support' }],
    [{ text: '👨‍💻 Operator bilan bog\'lanish' }],
  ],
  resize_keyboard: true,
  is_persistent: true,
};

// Help find customer by phone or INN
async function findCustomerByQuery(query: string) {
  const cleanPhone = query.replace(/[^\d]/g, '');
  const last9Digits = cleanPhone.slice(-9);

  return prisma.customer.findFirst({
    where: {
      OR: [
        { inn: query.trim() },
        { phone: { contains: last9Digits } },
      ],
      deletedAt: null,
    },
    include: {
      branch: true,
      terminals: true,
      posSystems: true,
      fiscalModules: true,
      productSerials: { include: { product: true } },
      orders: { take: 5, orderBy: { createdAt: 'desc' } },
      payments: { take: 5, orderBy: { paidAt: 'desc' } },
      installations: { take: 5, orderBy: { createdAt: 'desc' } },
    },
  });
}

// Main Telegram Update Handler
export async function handleTelegramUpdate(update: any) {
  try {
    const message = update.message;
    const callbackQuery = update.callback_query;

    const chatId = String(message?.chat?.id || callbackQuery?.message?.chat?.id);
    if (!chatId) return { ok: true };

    const session = userSessions.get(chatId) || { step: 'IDLE' };

    // -------------------------------------------------------------
    // 1. Handle Inline Keyboard Callbacks (Category / Device / Actions)
    // -------------------------------------------------------------
    if (callbackQuery) {
      const data = callbackQuery.data;

      // Category selection callback
      if (data.startsWith('cat:')) {
        const category = data.replace('cat:', '');
        session.tempCategory = category;
        session.step = 'SUPPORT_CHOOSE_DEVICE';
        userSessions.set(chatId, session);

        // Fetch customer devices
        const customer = await prisma.customer.findFirst({
          where: { telegramChatId: chatId },
          include: { productSerials: { include: { product: true } } },
        });

        const deviceButtons = (customer?.productSerials || []).map((s) => [
          { text: `🖥 ${s.product.name} (${s.serialNumber})`, callback_data: `dev:${s.product.name} №${s.serialNumber}` },
        ]);
        deviceButtons.push([{ text: '➕ Boshqa qurilma / Dasturiy nosozlik', callback_data: 'dev:Umumiy qurilma' }]);

        await sendTelegramMessage(chatId, `📂 Kategoriya: <b>${category}</b>\n\nQaysi qurilmangizda nosozlik kuzatilmoqda?`, {
          reply_markup: { inline_keyboard: deviceButtons },
        });
        return { ok: true };
      }

      // Device selection callback
      if (data.startsWith('dev:')) {
        const device = data.replace('dev:', '');
        session.tempDevice = device;
        session.step = 'SUPPORT_ENTER_ISSUE';
        userSessions.set(chatId, session);

        await sendTelegramMessage(
          chatId,
          `🖥 Qurilma: <b>${device}</b>\n\nIltimos, yuzaga kelgan muammoni batafsil yozib yuboring (Masalan: chek chiqmayapti, E-03 xatosi beryapti...):`
        );
        return { ok: true };
      }

      // Skip photo callback
      if (data === 'skip_photo') {
        return finalizeSupportTicket(chatId, session, null);
      }
    }

    const text = message?.text?.trim() || '';
    const contact = message?.contact;
    const photo = message?.photo;

    // -------------------------------------------------------------
    // 2. Handle /start and Authentication / Identification
    // -------------------------------------------------------------
    if (text === '/start') {
      session.step = 'IDLE';
      userSessions.set(chatId, session);

      // Check if already identified
      const existingCustomer = await prisma.customer.findFirst({
        where: { telegramChatId: chatId },
      });

      if (existingCustomer) {
        await sendTelegramMessage(
          chatId,
          `👋 <b>Assalomu alaykum, ${existingCustomer.companyName}!</b>\n\n` +
          `ONKM Business ERP mijoz botiga xush kelibsiz. Quyidagi menyu orqali kerakli bo'limni tanlang:`,
          { reply_markup: MAIN_MENU_KEYBOARD }
        );
        return { ok: true };
      }

      // Not identified: Ask for Contact or STIR
      session.step = 'AWAITING_AUTH';
      userSessions.set(chatId, session);

      await sendTelegramMessage(
        chatId,
        `👋 <b>Assalomu alaykum!</b>\n\n` +
        `<b>ONKM Business ERP</b> rasmiy mijozlar botiga xush kelibsiz.\n\n` +
        `Kompaniyangiz va uskunalar ma'lumotlarini ko'rish uchun quyidagi tugmani bosib <b>telefon raqamingizni yuboring</b> yoki kompaniyangiz <b>STIR (INN)</b> raqamini yozing:`,
        {
          reply_markup: {
            keyboard: [
              [{ text: '📱 Telefon raqamimni yuborish', request_contact: true }],
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
          },
        }
      );
      return { ok: true };
    }

    // -------------------------------------------------------------
    // 3. Identification Process (Contact or STIR text)
    // -------------------------------------------------------------
    if (session.step === 'AWAITING_AUTH' || contact) {
      const query = contact ? contact.phone_number : text;
      const matchedCustomer = await findCustomerByQuery(query);

      if (matchedCustomer) {
        // Link Telegram chat ID
        await prisma.customer.update({
          where: { id: matchedCustomer.id },
          data: {
            telegramChatId: chatId,
            telegramUsername: message?.from?.username || null,
          },
        });

        session.customerId = matchedCustomer.id;
        session.step = 'IDLE';
        userSessions.set(chatId, session);

        await sendTelegramMessage(
          chatId,
          `✅ <b>Muvaffaqiyatli aniqlandi!</b>\n\n` +
          `🏢 <b>Kompaniya:</b> ${matchedCustomer.companyName}\n` +
          `🔢 <b>STIR:</b> ${matchedCustomer.inn}\n` +
          `📍 <b>Filial:</b> ${matchedCustomer.branch?.name} filiali\n\n` +
          `Quyidagi menyudan kerakli bo'limni tanlang:`,
          { reply_markup: MAIN_MENU_KEYBOARD }
        );
        return { ok: true };
      } else {
        await sendTelegramMessage(
          chatId,
          `❌ Ushbu ma'lumot bo'yicha tizimda mijoz topilmadi.\n\n` +
          `Iltimos, kompaniyangizning <b>9 xonali STIR (INN)</b> raqamini to'g'ri kiritib ko'ring yoki call-center bilan bog'laning:`
        );
        return { ok: true };
      }
    }

    // Ensure customer is identified before accessing main menu
    const customer = await prisma.customer.findFirst({
      where: { telegramChatId: chatId },
      include: {
        branch: true,
        terminals: true,
        posSystems: true,
        fiscalModules: true,
        productSerials: { include: { product: true } },
        orders: { take: 5, orderBy: { createdAt: 'desc' } },
        payments: { take: 5, orderBy: { paidAt: 'desc' } },
        installations: { take: 5, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!customer) {
      if (text !== '/start') {
        await sendTelegramMessage(chatId, 'Iltimos, avval /start buyrug\'ini yuboring va o\'zingizni tasdiqlang.');
      }
      return { ok: true };
    }

    // -------------------------------------------------------------
    // 4. Support Multi-Step Ticket Submission Flow
    // -------------------------------------------------------------
    if (session.step === 'SUPPORT_ENTER_ISSUE') {
      session.tempIssue = text;
      session.step = 'SUPPORT_SEND_PHOTO';
      userSessions.set(chatId, session);

      await sendTelegramMessage(
        chatId,
        `📸 <b>Foto yoki xatolik skrinshoti:</b>\n\n` +
        `Nosozlik aks etgan rasmni yuboring yoki quyidagi tugma orqali rasm yuklamasdan davom eting:`,
        {
          reply_markup: {
            inline_keyboard: [[{ text: '➡️ Rasmsiz yuborish (O\'tkazib yuborish)', callback_data: 'skip_photo' }]],
          },
        }
      );
      return { ok: true };
    }

    if (session.step === 'SUPPORT_SEND_PHOTO') {
      let photoUrl = null;
      if (photo && photo.length > 0) {
        const fileId = photo[photo.length - 1].file_id;
        photoUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${fileId}`;
      }
      return finalizeSupportTicket(chatId, session, photoUrl);
    }

    // -------------------------------------------------------------
    // 5. MAIN MENU Handlers
    // -------------------------------------------------------------
    if (text === '🏢 Mening kompaniyam') {
      const debtText = customer.debt > 0
        ? `🔴 ${customer.debt.toLocaleString()} so'm (Qarzdorlik)`
        : '🟢 To\'liq to\'langan (Qarz yo\'q)';

      const msg = `🏢 <b>KOMPANIYA PROFILI:</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `🏢 <b>Nomi:</b> ${customer.companyName}\n` +
        `🔢 <b>STIR (INN):</b> ${customer.inn}\n` +
        `🏷 <b>Yuridik shakl:</b> ${customer.companyType}\n` +
        `📍 <b>Manzil:</b> ${customer.address}\n` +
        `🏛 <b>Filial:</b> ${customer.branch?.name} filiali\n` +
        `📶 <b>OFD Holati:</b> <b>${customer.ofdStatus}</b>\n` +
        `💰 <b>Balans / Hisob:</b> ${debtText}\n` +
        `━━━━━━━━━━━━━━━━━━━━`;

      await sendTelegramMessage(chatId, msg, { reply_markup: MAIN_MENU_KEYBOARD });
      return { ok: true };
    }

    if (text === '🖥 Mening qurilmalarim') {
      const serials = customer.productSerials || [];
      const terminals = customer.terminals || [];
      const fms = customer.fiscalModules || [];

      let list = `🖥 <b>RO'YXATDAN O'TGAN QURILMALARINGIZ:</b>\n━━━━━━━━━━━━━━━━━━━━\n\n`;

      if (serials.length > 0) {
        list += `<b>Online Kassa & POS tizimlari:</b>\n`;
        serials.forEach((s: any, idx: number) => {
          list += `${idx + 1}. <b>${s.product?.name}</b>\n   Seriya: <code>${s.serialNumber}</code> | Holat: ${s.status}\n`;
        });
        list += `\n`;
      }

      if (fms.length > 0) {
        list += `<b>Fiskal Modullar (FM):</b>\n`;
        fms.forEach((f: any, idx: number) => {
          list += `${idx + 1}. FM № <code>${f.serialNumber}</code> | Holat: ${f.status}\n`;
        });
        list += `\n`;
      }

      if (terminals.length > 0) {
        list += `<b>Bank Terminallari:</b>\n`;
        terminals.forEach((t: any, idx: number) => {
          list += `${idx + 1}. ${t.model} (TID: ${t.tid}) | Bank: ${t.bankName}\n`;
        });
      }

      if (serials.length === 0 && fms.length === 0 && terminals.length === 0) {
        list += `<i>Hozircha biriktirilgan qurilmalar topilmadi.</i>`;
      }

      await sendTelegramMessage(chatId, list, { reply_markup: MAIN_MENU_KEYBOARD });
      return { ok: true };
    }

    if (text === '🛒 Buyurtmalarim') {
      const orders = customer.orders || [];
      let list = `🛒 <b>SO'NGGI BUYURTMALAR:</b>\n━━━━━━━━━━━━━━━━━━━━\n\n`;

      orders.forEach((o: any) => {
        list += `📦 <b>${o.orderNumber}</b>\n` +
          `   Qiymat: <b>${(o.finalAmount || 0).toLocaleString()} so'm</b>\n` +
          `   Holat: <b>${o.status}</b> | To'lov: ${o.paymentStatus}\n` +
          `   Sana: ${new Date(o.createdAt).toLocaleDateString('uz')}\n\n`;
      });

      if (orders.length === 0) {
        list += `<i>Hozircha buyurtmalar mavjud emas.</i>`;
      }

      await sendTelegramMessage(chatId, list, { reply_markup: MAIN_MENU_KEYBOARD });
      return { ok: true };
    }

    if (text === '💳 To\'lovlarim') {
      const payments = customer.payments || [];
      let list = `💳 <b>TO'LOVLAR TARIXI:</b>\n━━━━━━━━━━━━━━━━━━━━\n\n`;

      payments.forEach((p: any) => {
        list += `💰 <b>+${(p.amount || 0).toLocaleString()} so'm</b> (${p.method})\n` +
          `   Chek No: <code>${p.paymentNumber}</code>\n` +
          `   Sana: ${new Date(p.paidAt).toLocaleDateString('uz')}\n\n`;
      });

      if (payments.length === 0) {
        list += `<i>To'lovlar tarixi mavjud emas.</i>`;
      }

      await sendTelegramMessage(chatId, list, { reply_markup: MAIN_MENU_KEYBOARD });
      return { ok: true };
    }

    if (text === '🛠 Kafolat') {
      const serials = customer.productSerials || [];
      let list = `🛠 <b>QURILMALAR KAFOLAT MUDDATLARI:</b>\n━━━━━━━━━━━━━━━━━━━━\n\n`;

      serials.forEach((s: any) => {
        const warrantyDate = s.warrantyEndDate
          ? new Date(s.warrantyEndDate).toLocaleDateString('uz')
          : '1 yil kafolat (Faol)';
        list += `🛡 <b>${s.product?.name}</b>\n` +
          `   Seriya: <code>${s.serialNumber}</code>\n` +
          `   Kafolat: <b>${warrantyDate}</b>\n\n`;
      });

      if (serials.length === 0) {
        list += `<i>Kafolatlangan qurilmalar qayd etilmagan.</i>`;
      }

      await sendTelegramMessage(chatId, list, { reply_markup: MAIN_MENU_KEYBOARD });
      return { ok: true };
    }

    if (text === '🎫 Support') {
      session.step = 'SUPPORT_CHOOSE_CATEGORY';
      userSessions.set(chatId, session);

      const categoryButtons = [
        [{ text: '📟 KKM Kassa', callback_data: 'cat:KKM' }, { text: '🖥 POS Monoblok', callback_data: 'cat:POS' }],
        [{ text: '💳 Terminal', callback_data: 'cat:Terminal' }, { text: '💾 Fiskal modul', callback_data: 'cat:Fiskal modul' }],
        [{ text: '📶 OFD Aloqasi', callback_data: 'cat:OFD' }, { text: '🌐 Internet / Wi-Fi', callback_data: 'cat:Internet' }],
        [{ text: '🖨 Chek Printer', callback_data: 'cat:Printer' }, { text: '📱 Click / Payme', callback_data: 'cat:Click' }],
        [{ text: '💻 Dasturiy nosozlik', callback_data: 'cat:Dastur' }, { text: '❓ Boshqa masala', callback_data: 'cat:Boshqa' }],
      ];

      await sendTelegramMessage(
        chatId,
        `🎫 <b>SUPPORT (TEXNIK YORDAM) XIZMATI:</b>\n\nNosozlik qaysi toifaga tegishli? Tugmalardan birini tanlang:`,
        { reply_markup: { inline_keyboard: categoryButtons } }
      );
      return { ok: true };
    }

    if (text === '👨‍💻 Operator bilan bog\'lanish') {
      await sendTelegramMessage(
        chatId,
        `👨‍💻 <b>ONKM CALL-CENTER & SUPPORT XIZMATI:</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📞 <b>Qisqa raqam:</b> 1144\n` +
        `📱 <b>Tezkor aloqa:</b> +998 (71) 200-00-11\n` +
        `✈️ <b>Telegram qo'llab-quvvatlash:</b> @onkm_support_bot\n` +
        `⏰ <b>Ish vaqti:</b> 24/7 (Dam olish kunlarisiz)\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `<i>Shuningdek, "🎫 Support" tugmasi orqali to'g'ridan-to'g'ri tizimga chipta yuborishingiz mumkin.</i>`,
        { reply_markup: MAIN_MENU_KEYBOARD }
      );
      return { ok: true };
    }

    // Default response
    await sendTelegramMessage(
      chatId,
      `Kechirasiz, buyruq tushunarsiz. Quyidagi menyudan foydalaning:`,
      { reply_markup: MAIN_MENU_KEYBOARD }
    );
    return { ok: true };
  } catch (error: any) {
    console.error('handleTelegramUpdate error:', error);
    return { ok: false, error: error.message };
  }
}

// Finalize support ticket and save to database
async function finalizeSupportTicket(chatId: string, session: any, photoUrl: string | null) {
  const customer = await prisma.customer.findFirst({
    where: { telegramChatId: chatId },
    include: { branch: true },
  });

  if (!customer) {
    await sendTelegramMessage(chatId, 'Xatolik: Mijoz aniqlanmadi.');
    return { ok: false };
  }

  const year = new Date().getFullYear();
  const count = await prisma.supportTicket.count();
  const ticketNumber = `TCK-${year}-${String(count + 1).padStart(4, '0')}`;

  const category = session.tempCategory || 'KKM';
  const deviceName = session.tempDevice || 'Online Kassa';
  const issue = session.tempIssue || 'Telegram orqali murojaat';

  const newTicket = await prisma.supportTicket.create({
    data: {
      ticketNumber,
      customerId: customer.id,
      branchId: customer.branchId,
      category,
      deviceName,
      issue,
      priority: 'ODDIY',
      status: 'YANGI',
      messages: {
        create: [
          {
            senderType: 'CUSTOMER',
            senderName: `${customer.companyName} (Telegram)`,
            message: issue,
            attachmentUrl: photoUrl,
          },
        ],
      },
    },
    include: { customer: true, branch: true },
  });

  // Reset session
  session.step = 'IDLE';
  session.tempCategory = undefined;
  session.tempDevice = undefined;
  session.tempIssue = undefined;
  userSessions.set(chatId, session);

  // Send confirmation to Customer
  await sendTelegramMessage(
    chatId,
    `✅ <b>Murojaatingiz qabul qilindi!</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🎫 <b>Chipta raqami:</b> <code>#${newTicket.ticketNumber}</code>\n` +
    `📂 <b>Kategoriya:</b> ${category}\n` +
    `🖥 <b>Qurilma:</b> ${deviceName}\n` +
    `📌 <b>Holat:</b> Yangi (Ko'rib chiqilmoqda)\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `<i>Mutaxassislarimiz murojaatni ko'rib chiqib, tez orada siz bilan bog'lanishadi. Holat o'zgarganda bot orqali xabar yuboriladi.</i>`,
    { reply_markup: MAIN_MENU_KEYBOARD }
  );

  // Notify Support Operator in Telegram
  await notifySupportOperators(newTicket);

  return { ok: true, ticket: newTicket };
}
