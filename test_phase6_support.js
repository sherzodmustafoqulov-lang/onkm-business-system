// test_phase6_support.js
// Automated test suite for PHASE 6: Support Ticket System, Chat Messaging, 360 Context, and AI Diagnostic Readiness

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runPhase6Tests() {
  console.log('====================================================');
  console.log('🎧 PHASE 6: PROFESSIONAL SUPPORT TICKET SYSTEM TEST');
  console.log('====================================================\n');

  try {
    const customer = await prisma.customer.findFirst({ where: { deletedAt: null } });
    if (!customer) throw new Error('Customer topilmadi');

    const operator = await prisma.user.findFirst({ where: { role: { name: 'SUPPORT' } } });
    const technician = await prisma.user.findFirst({ where: { role: { name: 'TECHNICIAN' } } });

    console.log(`📌 Test Subyektlari:`);
    console.log(`   Mijoz: ${customer.companyName} (STIR: ${customer.inn})`);
    console.log(`   Support Operator: ${operator?.name || 'Operator'}`);
    console.log(`   Servis Texnik: ${technician?.name || 'Texnik'}\n`);

    // -------------------------------------------------------------
    // TEST 1: Yangi Chipta (Support Ticket) Yaratish
    // -------------------------------------------------------------
    console.log('--- TEST 1: Yangi Support Chiptasi Yaratish (OFD / KKM) ---');
    const ticketNum = `TCK-TEST-${Date.now().toString().slice(-5)}`;
    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber: ticketNum,
        customerId: customer.id,
        branchId: customer.branchId,
        deviceName: 'Aclas CRV-100 Online Kassa',
        serialNumber: 'CRV-99881122',
        category: 'OFD',
        issue: 'Kassadan chek chiqmoqda, lekin soliq serveriga (OFD) yetib bormayapti. Xatolik: E-03.',
        priority: 'SHOSHILINCH',
        status: 'YANGI',
        assignedToId: operator?.id,
        technicianId: technician?.id,
        messages: {
          create: [
            {
              senderType: 'CUSTOMER',
              senderName: customer.companyName,
              message: 'Assalomu alaykum, ertalabdan beri cheklarimiz soliq portalida ko\'rinmayapti, yordam bering!',
            },
          ],
        },
      },
      include: { customer: true, messages: true },
    });

    console.log(`✅ Chipta yaratildi: ${ticket.ticketNumber}`);
    console.log(`   Kategoriya: ${ticket.category}, Muhimlik: ${ticket.priority}`);
    console.log(`   Muammo: ${ticket.issue}`);
    console.log(`   Boshlang'ich xabarlar soni: ${ticket.messages.length} ta\n`);

    // -------------------------------------------------------------
    // TEST 2: Jonli Chat Xabarlari (Operator va Mijoz)
    // -------------------------------------------------------------
    console.log('--- TEST 2: Support Chat Jonli Muloqot ---');

    // Operator reply
    const opMsg = await prisma.supportMessage.create({
      data: {
        ticketId: ticket.id,
        senderType: 'USER',
        senderId: operator?.id,
        senderName: operator?.name || 'Support Operator',
        message: 'Assalomu alaykum! Kassadagi Ethernet kabeli yoki Wi-Fi holatini tekshiring va 10 soniyaga apparatni o\'chirib yoqing.',
      },
    });

    // Update status to JAVOB_KUTILMOQDA
    await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: { status: 'JAVOB_KUTILMOQDA' },
    });

    // Customer answer
    const custMsg = await prisma.supportMessage.create({
      data: {
        ticketId: ticket.id,
        senderType: 'CUSTOMER',
        senderName: customer.companyName,
        message: 'O\'chirib yoqdik, internet qayta ulandi va to\'plangan 14 ta chek soliq portaliga ketdi! Katta rahmat.',
      },
    });

    const msgs = await prisma.supportMessage.findMany({ where: { ticketId: ticket.id } });
    console.log(`✅ Chat muloqoti yozildi: jami ${msgs.length} ta xabar.`);
    msgs.forEach((m) => {
      console.log(`   [${m.senderType}] ${m.senderName}: "${m.message.slice(0, 50)}..."`);
    });
    console.log('');

    // -------------------------------------------------------------
    // TEST 3: 360° Kontekst va AI Diagnostik Tahlil (AI Readiness)
    // -------------------------------------------------------------
    console.log('--- TEST 3: 360° Kontekst Yig\'ish va AI Diagnostik Tavsiya ---');

    // Gather 360 context
    const [devices, prevTickets, installs] = await Promise.all([
      prisma.productSerial.findMany({ where: { customerId: customer.id } }),
      prisma.supportTicket.findMany({ where: { customerId: customer.id, id: { not: ticket.id } } }),
      prisma.installation.findMany({ where: { customerId: customer.id } }),
    ]);

    console.log(`   📦 Mijoz uskunalari bazasi: ${devices.length} ta serial apparat`);
    console.log(`   📋 Oldingi murojaatlar tarixi: ${prevTickets.length} ta chipta`);
    console.log(`   🛠️ O'rnatishlar tarixi: ${installs.length} ta montaj akti`);

    // Simulated AI diagnostic output based on context
    const aiDiagnosis = `🔍 [AI Tahlil: OFD & Soliq Serveri Aloqasi]
- Ehtimoliy sabab: Kassa apparati va Soliq Qo'mitasi (OFD) o'rtasidagi tarmoq ulanish uzilishi.
- Qurilma: ${ticket.deviceName} (${ticket.serialNumber}).
- Tavsiya: Tarmoq kabelini tekshirish va apparatni qayta yuklash (Restart).`;

    await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: { aiDiagnosis },
    });

    const checkWithAi = await prisma.supportTicket.findUnique({ where: { id: ticket.id } });
    console.log(`✅ AI Diagnostika muvaffaqiyatli saqlandi:`);
    console.log(`   ${checkWithAi.aiDiagnosis.split('\n')[0]}\n`);

    // -------------------------------------------------------------
    // TEST 4: Chiptani Yechish va Yopish (Resolution & Close)
    // -------------------------------------------------------------
    console.log('--- TEST 4: Murojaatni Yechish va Chiptani Yopish (Resolution) ---');
    const solutionText = 'Kassa tarmoq xizmati qayta ishga tushirildi, internet tiklandi va to\'plangan cheklar OFDga yetkazildi.';

    const closedTicket = await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: {
        status: 'YECHILDI',
        solution: solutionText,
        closedAt: new Date(),
      },
    });

    console.log(`✅ Chipta holati: ${closedTicket.status}`);
    console.log(`   Yechim: ${closedTicket.solution}`);
    console.log(`   Yopilgan vaqt: ${closedTicket.closedAt}`);

    console.log('\n====================================================');
    console.log('🎉 PHASE 6 SUPPORT INTEGRATION TESTLARI MUVAFFAQIYATLI O\'TDI!');
    console.log('====================================================');
  } catch (err) {
    console.error('❌ Testda xatolik:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase6Tests();
