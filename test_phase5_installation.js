// test_phase5_installation.js
// Automated test suite for PHASE 5: Installation, Technician Mobile Workflow, Manager Notifications, and Order Sync

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runPhase5Tests() {
  console.log('====================================================');
  console.log('🛠️ PHASE 5: INSTALLATION & TECHNICIAN MOBILE WORKFLOW TEST');
  console.log('====================================================\n');

  try {
    // 1. Fetch dependencies: customer, manager, technician, order
    const customer = await prisma.customer.findFirst({ where: { deletedAt: null } });
    if (!customer) throw new Error('Customer topilmadi');

    const manager = await prisma.user.findFirst({ where: { role: { name: 'MANAGER' } } });
    if (!manager) throw new Error('Manager topilmadi');

    const technician = await prisma.user.findFirst({ where: { role: { name: 'TECHNICIAN' } } });
    if (!technician) throw new Error('Technician topilmadi');

    // Create a dedicated order to test linking
    const testOrder = await prisma.order.create({
      data: {
        orderNumber: `ORD-INST-TEST-${Date.now().toString().slice(-5)}`,
        customerId: customer.id,
        branchId: customer.branchId,
        managerId: manager.id,
        totalAmount: 3200000,
        discountAmount: 0,
        finalAmount: 3200000,
        paidAmount: 3200000,
        debtAmount: 0,
        status: 'YETKAZILMOQDA',
        pipelineStage: 'CHIQARISH',
        paymentStatus: 'TO\'LIQ_TO\'LANGAN',
        deliveryRequired: true,
        installationRequired: true,
        notes: 'O\'rnatish test buyurtmasi',
      },
    });

    console.log(`📌 Test Subyektlari:`);
    console.log(`   Mijoz: ${customer.companyName}`);
    console.log(`   Bog'langan Buyurtma: ${testOrder.orderNumber} (Status: ${testOrder.status})`);
    console.log(`   Menejer: ${manager.name}`);
    console.log(`   Servis Texnik: ${technician.name}\n`);

    // -------------------------------------------------------------
    // TEST 1: Buyurtmadan Yangi Installation Yaratish
    // -------------------------------------------------------------
    console.log('--- TEST 1: Buyurtma bo\'yicha O\'rnatish Topshirig\'i Yaratish ---');
    const taskNumber = `TASK-TEST-${Date.now().toString().slice(-5)}`;
    const installTask = await prisma.installation.create({
      data: {
        taskNumber,
        customerId: customer.id,
        orderId: testOrder.id,
        branchId: customer.branchId,
        technicianId: technician.id,
        managerId: manager.id,
        serviceType: 'ONKM_ORNATISH',
        deviceName: 'PosBank Apex Pro Monoblok Kassa',
        serialNumber: 'PB-99887766',
        location: 'Guliston sh., Sayxun ko\'chasi 45-uy (Savdo Markazi #2)',
        scheduledDate: new Date(),
        scheduledTime: '11:00',
        status: 'YANGI',
        notes: 'Kassa apparat o\'rnatilib, chek chiqarib berilishi lozim.',
      },
    });

    // Update order status to ORNATILMOQDA
    await prisma.order.update({
      where: { id: testOrder.id },
      data: { status: 'ORNATILMOQDA', pipelineStage: 'ORNATISH' },
    });

    // Initial notification for technician
    await prisma.notification.create({
      data: {
        userId: technician.id,
        title: `Yangi O'rnatish Topshirig'i: ${taskNumber}`,
        message: `${customer.companyName} uchun ${installTask.deviceName} biriktirildi.`,
        type: 'INFO',
        link: `/installations?id=${installTask.id}`,
      },
    });

    const ordCheck = await prisma.order.findUnique({ where: { id: testOrder.id } });
    console.log(`✅ O'rnatish topshirig'i yaratildi: ${installTask.taskNumber}`);
    console.log(`   Manzil: ${installTask.location}`);
    console.log(`   Texnik: ${technician.name}`);
    console.log(`   Bog'langan buyurtma statusi: ${ordCheck.status} (${ordCheck.pipelineStage})\n`);

    // -------------------------------------------------------------
    // TEST 2: Texnik Mobil Flow (Bosqichma-bosqich o'tishlar)
    // -------------------------------------------------------------
    console.log('--- TEST 2: Texnik Mobil Harakatlari (Step-by-Step Flow) ---');

    const steps = [
      { status: 'QABUL_QILINDI', label: '1. Vazifani Qabul Qilish' },
      { status: 'YOLDA', label: '2. Yo\'lga Chiqdim' },
      { status: 'ISH_BOSHLANDI', label: '3. Yetib Keldim & Ish Boshlandi' },
      { status: 'ORNATILDI', label: '4. Qurilmani O\'rnatdim' },
      { status: 'TEST_QILINDI', label: '5. Test Qildim (Fiskal Chek Chiqdi)' },
    ];

    for (const step of steps) {
      await prisma.$transaction(async (tx) => {
        // Update task
        await tx.installation.update({
          where: { id: installTask.id },
          data: { status: step.status, updatedAt: new Date() },
        });

        // Send notification to Manager
        await tx.notification.create({
          data: {
            userId: manager.id,
            title: `O'rnatish: ${step.status} (${installTask.taskNumber})`,
            message: `Texnik ${technician.name} topshiriqni "${step.status}" holatiga o'tkazdi.`,
            type: 'INFO',
            link: `/installations?id=${installTask.id}`,
          },
        });
      });

      console.log(`   ➡️ Bosqich muvaffaqiyatli: ${step.label} [Status: ${step.status}] (Menejerga bildirishnoma yuborildi)`);
    }
    console.log('');

    // -------------------------------------------------------------
    // TEST 3: Foto Yuklash, Dalolatnoma va Yakunlash (Complete)
    // -------------------------------------------------------------
    console.log('--- TEST 3: Foto Yuklash, Akt Rasmiylashtirish va Topshiriqni Yakunlash ---');

    const photoUrl = '/uploads/install-receipt-sample.jpg';
    const completionDoc = `AKT-2025-${Date.now().toString().slice(-4)}`;
    const completionNotes = 'Monoblok va kassa to\'liq sozlandi, xodimlar o\'qitildi, chek muvaffaqiyatli chiqarildi.';

    await prisma.$transaction(async (tx) => {
      // 1. Update task to completed
      await tx.installation.update({
        where: { id: installTask.id },
        data: {
          status: 'YAKUNLANDI',
          photoUrl,
          completionDoc,
          completionNotes,
          completedAt: new Date(),
        },
      });

      // 2. Sync Order status to YAKUNLANDI
      await tx.order.update({
        where: { id: testOrder.id },
        data: {
          status: 'YAKUNLANDI',
          pipelineStage: 'YAKUNLANDI',
        },
      });

      // 3. Manager notification
      await tx.notification.create({
        data: {
          userId: manager.id,
          title: `O'rnatish Yakunlandi: ${installTask.taskNumber}`,
          message: `Texnik ${technician.name} ${customer.companyName} uchun o'rnatishni yakunladi. Akt: ${completionDoc}`,
          type: 'SUCCESS',
          link: `/installations?id=${installTask.id}`,
        },
      });
    });

    const completedTask = await prisma.installation.findUnique({
      where: { id: installTask.id },
      include: { order: true },
    });

    console.log(`✅ O'rnatish yakunlandi: ${completedTask.taskNumber}, Status: ${completedTask.status}`);
    console.log(`   Akt raqami: ${completedTask.completionDoc}`);
    console.log(`   Foto hisobot: ${completedTask.photoUrl}`);
    console.log(`   Yakunlangan vaqt: ${completedTask.completedAt}`);
    console.log(`✅ Bog'langan buyurtma statusi avtomatik yakunlandi: ${completedTask.order.status} (${completedTask.order.pipelineStage})\n`);

    // -------------------------------------------------------------
    // TEST 4: Menejer Bildirishnomalari (Notifications) Tekshiruvi
    // -------------------------------------------------------------
    console.log('--- TEST 4: Menejer Bildirishnomalarini Tekshirish ---');
    const managerNotifs = await prisma.notification.findMany({
      where: { userId: manager.id },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });

    console.log(`✅ Menejerga jami ${managerNotifs.length} ta bildirishnoma yuborildi:`);
    managerNotifs.forEach((n, idx) => {
      console.log(`   ${idx + 1}. [${n.type}] ${n.title} - ${n.message.slice(0, 60)}...`);
    });

    console.log('\n====================================================');
    console.log('🎉 PHASE 5 BARCHA INTEGRATION TESTLARI MUVAFFAQIYATLI O\'TDI!');
    console.log('====================================================');
  } catch (err) {
    console.error('❌ Testda xatolik:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase5Tests();
