// src/lib/telegram.ts
// Production-ready Telegram Bot Service for ONKM ERP System

const TELEGRAM_API_BASE = 'https://api.telegram.org';

export function getBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn('⚠️ TELEGRAM_BOT_TOKEN .env faylida belgilanmagan!');
    return '';
  }
  return token;
}

export function getOperatorChatId(): string {
  return process.env.TELEGRAM_OPERATOR_CHAT_ID || '';
}

// Send standard message via Telegram Bot API
export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  options: {
    parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
    reply_markup?: any;
  } = {}
) {
  const token = getBotToken();
  if (!token) return { ok: false, error: 'Bot token mavjud emas' };

  try {
    const payload = {
      chat_id: chatId,
      text,
      parse_mode: options.parse_mode || 'HTML',
      reply_markup: options.reply_markup,
    };

    const res = await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    return data;
  } catch (error: any) {
    console.error('sendTelegramMessage error:', error);
    return { ok: false, error: error.message };
  }
}

// Send photo with caption
export async function sendTelegramPhoto(
  chatId: string | number,
  photoUrl: string,
  caption: string,
  options: any = {}
) {
  const token = getBotToken();
  if (!token) return { ok: false, error: 'Bot token mavjud emas' };

  try {
    const payload = {
      chat_id: chatId,
      photo: photoUrl,
      caption,
      parse_mode: options.parse_mode || 'HTML',
      reply_markup: options.reply_markup,
    };

    const res = await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return await res.json();
  } catch (error: any) {
    console.error('sendTelegramPhoto error:', error);
    return { ok: false, error: error.message };
  }
}

// Notify Support Operator about new ticket
export async function notifySupportOperators(ticket: any) {
  const operatorChatId = getOperatorChatId();
  if (!operatorChatId) {
    console.log(`ℹ️ [Telegram] Operator Chat ID kiritilmagan, chipta xabarnomasi faqat webda qayd etildi (${ticket.ticketNumber})`);
    return;
  }

  const message = `🚨 <b>YANGI SUPPORT MUROJAATI!</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🎫 <b>Chipta:</b> #${ticket.ticketNumber}\n` +
    `🏢 <b>Mijoz:</b> ${ticket.customer?.companyName || 'Mijoz'}\n` +
    `📂 <b>Kategoriya:</b> ${ticket.category}\n` +
    `🖥 <b>Qurilma:</b> ${ticket.deviceName || 'Kassa'}\n` +
    `⚡ <b>Muhimlik:</b> ${ticket.priority}\n` +
    `📝 <b>Muammo:</b> ${ticket.issue}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `<i>Boshqaruv panelida oching va javob yuboring.</i>`;

  return sendTelegramMessage(operatorChatId, message);
}

// Notify customer when ticket status changes
export async function notifyCustomerTicketUpdate(
  chatId: string | number,
  ticket: any,
  newStatus: string,
  extraNote?: string
) {
  if (!chatId) return;

  const STATUS_DESCRIPTIONS: Record<string, string> = {
    YANGI: 'Qabul qilindi va navbatga qo\'yildi',
    JARAYONDA: 'Operator ko\'rib chiqmoqda',
    JAVOB_KUTILMOQDA: 'Operator sizdan qo\'shimcha ma\'lumot kutmoqda',
    TEXNIKKA_BERILDI: 'Mintaqaviy servis texnikiga biriktirildi',
    YECHILDI: 'Muammo muvaffaqiyatli bartaraf etildi',
    YOPILDI: 'Chipta to\'liq yopildi',
  };

  const desc = STATUS_DESCRIPTIONS[newStatus] || newStatus;

  const message = `🔔 <b>Murojaatingiz holati yangilandi!</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🎫 <b>Chipta raqami:</b> #${ticket.ticketNumber}\n` +
    `📌 <b>Yangi holat:</b> <b>${newStatus}</b> (${desc})\n` +
    (extraNote ? `💬 <b>Izoh:</b> ${extraNote}\n` : '') +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `<i>Savollar bo'lsa, /menu orqali operator bilan bog'lanishingiz mumkin.</i>`;

  return sendTelegramMessage(chatId, message);
}
