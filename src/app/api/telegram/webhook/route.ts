import { NextResponse } from 'next/server';
import { handleTelegramUpdate } from '@/lib/telegramBotEngine';
import { getBotToken } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

// GET /api/telegram/webhook: Webhook health check & configuration status
export async function GET() {
  const token = getBotToken();
  return NextResponse.json({
    status: 'ONLINE',
    botConfigured: Boolean(token),
    webhookEndpoint: '/api/telegram/webhook',
    timestamp: new Date().toISOString(),
  });
}

// POST /api/telegram/webhook: Production Webhook listener for Telegram Bot API
export async function POST(request: Request) {
  try {
    const update = await request.json();
    const result = await handleTelegramUpdate(update);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Telegram Webhook error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
