// scripts/telegram_bot_runner.js
// Standalone Production Long-Polling Worker for ONKM Telegram Bot

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('❌ Xatolik: TELEGRAM_BOT_TOKEN .env faylida ko\'rsatilmagan!');
  process.exit(1);
}

const TELEGRAM_API = `https://api.telegram.org/bot${token}`;

let offset = 0;
let isRunning = true;

async function pollUpdates() {
  console.log('🤖 ONKM Telegram Bot Worker ishga tushdi...');
  console.log('📡 Long-polling orqali yangi xabarlar tinglanmoqda...\n');

  while (isRunning) {
    try {
      const res = await fetch(`${TELEGRAM_API}/getUpdates?offset=${offset}&timeout=30`);
      const data = await res.json();

      if (data.ok && data.result && data.result.length > 0) {
        for (const update of data.result) {
          offset = update.update_id + 1;
          await processUpdate(update);
        }
      }
    } catch (err) {
      console.error('Polling xatosi:', err.message);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

// Forward to webhook endpoint or handle directly
async function processUpdate(update) {
  try {
    const port = process.env.PORT || 3000;
    const res = await fetch(`http://localhost:${port}/api/telegram/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    });
    const json = await res.json();
    return json;
  } catch (err) {
    // If local dev server isn't running on port 3000, log cleanly
    console.log(`Update #${update.update_id} qabul qilindi`);
  }
}

process.on('SIGINT', () => {
  console.log('\n🛑 Bot to\'xtatilmoqda...');
  isRunning = false;
  prisma.$disconnect();
  process.exit(0);
});

// Run if called directly
if (require.main === module) {
  pollUpdates();
}

module.exports = { pollUpdates };
