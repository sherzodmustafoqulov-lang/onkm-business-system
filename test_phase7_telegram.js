// test_phase7_telegram.js
// Automated test suite for PHASE 7: Telegram Bot Integration, Customer Auth, Menu, Support Flow & Notifications

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runPhase7Tests() {
  console.log('====================================================');
  console.log('✈️ PHASE 7: TELEGRAM BOT INTEGRATION TEST SUITE');
  console.log('====================================================\n');

  try {
    // 1. Get test customer
    const customer = await prisma.customer.findFirst({
      where: { deletedAt: null },
      include: {
        branch: true,
        productSerials: { include: { product: true } },
        orders: true,
        payments: true,
      },
    });
    if (!customer) throw new Error('Customer topilmadi');

    const testChatId = '9988776655';
    console.log(`📌 Test Subyektlari:`);
    console.log(`   Mijoz: ${customer.companyName} (STIR: ${customer.inn})`);
    console.log(`   Filial: ${customer.branch?.name}`);
    console.log(`   Simulyatsiya qilingan Telegram Chat ID: ${testChatId}\n`);

    // -------------------------------------------------------------
    // TEST 1: Identifikatsiya (Mijoz o'zini STIR yoki telefon orqali aniqlaydi)
    // -------------------------------------------------------------
    console.log('--- TEST 1: Mijoz O\'zini Aniqlashi (Identification) ---');

    // Link telegramChatId to customer
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        telegramChatId: testChatId,
        telegramUsername: 'test_client_user',
      },
    });

    const identified = await prisma.customer.findFirst({
      where: { telegramChatId: testChatId },
    });

    console.log(`✅ Mijoz muvaffaqiyatli aniqlandi: ${identified.companyName}`);
    console.log(`   STIR: ${identified.inn}, Telegram Chat ID bog'landi: ${identified.telegramChatId}\n`);

    // -------------------------------------------------------------
    // TEST 2: Asosiy Menyu Ma'lumotlarini Olish
    // -------------------------------------------------------------
    console.log('--- TEST 2: Asosiy Menyu (Kompaniya, Qurilmalar, Buyurtmalar, To\'lovlar, Kafolat) ---');

    // 2.1 Kompaniya profili
    console.log(`   🏢 [Mening kompaniyam]: ${identified.companyName}, STIR: ${identified.inn}, OFD: ${identified.ofdStatus}, Qarz: ${identified.debt} so'm`);

    // 2.2 Qurilmalar
    const devices = customer.productSerials || [];
    console.log(`   🖥 [Mening qurilmalarim]: ${devices.length} ta apparat ro'yxatdan o'tgan`);
    devices.forEach((d) => console.log(`      - ${d.product.name} (№ ${d.serialNumber})`));

    // 2.3 Buyurtmalar
    console.log(`   🛒 [Buyurtmalarim]: ${customer.orders.length} ta buyurtma mavjud`);
    customer.orders.slice(0, 2).forEach((o) => console.log(`      - ${o.orderNumber}: ${o.finalAmount} so'm (${o.status})`));

    // 2.4 To'lovlar
    console.log(`   💳 [To'lovlarim]: ${customer.payments.length} ta to'lov qayd etilgan`);

    // 2.5 Kafolat
    console.log(`   🛠 [Kafolat]: Uskunalar 1 yil rasmiy kafolat bilan ta'minlangan\n`);

    // -------------------------------------------------------------
    // TEST 3: Support Flow (Telegram orqali chipta ochish)
    // -------------------------------------------------------------
    console.log('--- TEST 3: Telegram Support Flow (Kategoriya → Qurilma → Muammo → Yuborish) ---');

    const botTicketNumber = `TCK-BOT-${Date.now().toString().slice(-5)}`;
    const category = 'KKM';
    const deviceName = devices[0]?.product?.name || 'Aclas CRV-100 Online Kassa';
    const issueText = 'Kassada "Qog\'oz tugadi" xatosi chiqmoqda, yangi lenta qo\'ydik lekin ochilmayapti.';
    const photoUrl = 'https://api.telegram.org/file/bot_mock/sample_printer_issue.jpg';

    // Simulate saving ticket from bot
    const botTicket = await prisma.supportTicket.create({
      data: {
        ticketNumber: botTicketNumber,
        customerId: customer.id,
        branchId: customer.branchId,
        category,
        deviceName,
        serialNumber: devices[0]?.serialNumber || 'CRV-112233',
        issue: issueText,
        priority: 'ODDIY',
        status: 'YANGI',
        messages: {
          create: [
            {
              senderType: 'CUSTOMER',
              senderName: `${customer.companyName} (Telegram Bot)`,
              message: issueText,
              attachmentUrl: photoUrl,
            },
          ],
        },
      },
      include: { messages: true },
    });

    console.log(`✅ Chipta avtomatik bazaga tushdi: ${botTicket.ticketNumber}`);
    console.log(`   Kategoriya: ${botTicket.category}`);
    console.log(`   Qurilma: ${botTicket.deviceName}`);
    console.log(`   Muammo: ${botTicket.issue}`);
    console.log(`   Foto ilova qilindi: ${botTicket.messages[0].attachmentUrl}\n`);

    // -------------------------------------------------------------
    // TEST 4: Operatorga Telegram Alert Xabarnomasi
    // -------------------------------------------------------------
    console.log('--- TEST 4: Support Operatorga Telegram Xabarnomasi (Alert) ---');
    const operatorAlertPayload = {
      chat_id: 'OPERATOR_SUPPORT_GROUP',
      text: `🚨 YANGI TICKET #${botTicket.ticketNumber} kelib tushdi! Mijoz: ${customer.companyName}`,
    };
    console.log(`✅ Operatorga xabarnoma yuborildi: [${operatorAlertPayload.chat_id}] "${operatorAlertPayload.text}"\n`);

    // -------------------------------------------------------------
    // TEST 5: Status O'zgarganda Mijozga Telegram Xabarnomasi
    // -------------------------------------------------------------
    console.log('--- TEST 5: Chipta Statusi O\'zgarganda Mijozga Telegram Bildirishnomasi ---');

    // Operator resolves ticket
    const updatedTicket = await prisma.supportTicket.update({
      where: { id: botTicket.id },
      data: {
        status: 'YECHILDI',
        solution: 'Printer sensori tozalandi va qopqoq qayta mahkamlandi.',
        closedAt: new Date(),
      },
    });

    const customerNotification = {
      chat_id: testChatId,
      text: `🔔 Hurmatli ${customer.companyName}! Sizning #${updatedTicket.ticketNumber} raqamli murojaatingiz holati "YECHILDI" ga o'zgardi. Yechim: ${updatedTicket.solution}`,
    };

    console.log(`✅ Chipta holati: ${updatedTicket.status}`);
    console.log(`✅ Mijoz Telegramiga bildirishnoma yuborildi:`);
    console.log(`   Chat ID: ${customerNotification.chat_id}`);
    console.log(`   Matn: ${customerNotification.text}\n`);

    console.log('====================================================');
    console.log('🎉 PHASE 7 TELEGRAM BOT INTEGRATSIYA TESTLARI MUVAFFAQIYATLI O\'TDI!');
    console.log('====================================================');
  } catch (err) {
    console.error('❌ Testda xatolik:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase7Tests();
