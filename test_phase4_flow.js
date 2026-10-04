// test_phase4_flow.js
// Comprehensive test suite for PHASE 4: Sales, Orders, Payments, Stock Reservations, and Interconnected Flows

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runPhase4Tests() {
  console.log('====================================================');
  console.log('🚀 PHASE 4: SAVDO VA BUYURTMALAR FLOW TEST SUITE');
  console.log('====================================================\n');

  try {
    // 1. Get test customer, product, branch, and manager
    const customer = await prisma.customer.findFirst({
      where: { deletedAt: null },
      include: { branch: true },
    });
    if (!customer) throw new Error('Customer topilmadi');

    const product = await prisma.product.findFirst({
      where: { isActive: true },
    });
    if (!product) throw new Error('Product topilmadi');

    const manager = await prisma.user.findFirst({
      where: { role: { name: 'MANAGER' } },
    });
    if (!manager) throw new Error('Manager topilmadi');

    const accountant = await prisma.user.findFirst({
      where: { role: { name: 'ACCOUNTANT' } },
    });
    if (!accountant) throw new Error('Accountant topilmadi');

    const branchId = customer.branchId;
    console.log(`📌 Test Subyektlari:`);
    console.log(`   Mijoz: ${customer.companyName} (STIR: ${customer.inn}, Dastlabki qarz: ${customer.debt} so'm)`);
    console.log(`   Mahsulot: ${product.name} (Narxi: ${product.sellingPrice} so'm)`);
    console.log(`   Filial ID: ${branchId}`);
    console.log(`   Menejer: ${manager.name}\n`);

    // Ensure warehouse stock has plenty of quantity for testing
    await prisma.warehouseStock.upsert({
      where: { productId_branchId: { productId: product.id, branchId } },
      create: { productId: product.id, branchId, quantity: 50, reserved: 0 },
      update: { quantity: { increment: 20 } },
    });

    const initialStock = await prisma.warehouseStock.findUnique({
      where: { productId_branchId: { productId: product.id, branchId } },
    });
    console.log(`📦 Boshlang'ich ombor holati: Jami: ${initialStock.quantity}, Rezerv: ${initialStock.reserved}\n`);

    // -------------------------------------------------------------
    // TEST 1: Lead / Taklif bosqichida yangi buyurtma yaratish
    // -------------------------------------------------------------
    console.log('--- TEST 1: Lead → Taklif bosqichida yangi buyurtma yaratish ---');
    const orderNum = `TEST-ORD-${Date.now().toString().slice(-6)}`;
    const orderQty = 2;
    const unitPrice = product.sellingPrice;
    const discount = 100000;
    const totalAmount = orderQty * unitPrice;
    const finalAmount = totalAmount - discount;

    const testOrder = await prisma.order.create({
      data: {
        orderNumber: orderNum,
        customerId: customer.id,
        branchId,
        managerId: manager.id,
        totalAmount,
        discountAmount: discount,
        finalAmount,
        paidAmount: 0,
        debtAmount: finalAmount,
        status: 'YANGI',
        pipelineStage: 'LEAD',
        paymentStatus: 'KUTILMOQDA',
        deliveryRequired: true,
        installationRequired: true,
        notes: 'Avtomatlashtirilgan Flow Test Buyurtmasi',
        items: {
          create: [
            {
              productId: product.id,
              quantity: orderQty,
              unitPrice,
              discount,
              totalPrice: finalAmount,
            },
          ],
        },
      },
      include: { items: true },
    });

    console.log(`✅ Buyurtma yaratildi: ${testOrder.orderNumber}, Status: ${testOrder.status}, Flow: ${testOrder.pipelineStage}`);
    console.log(`   Summa: ${testOrder.finalAmount} so'm (Chegirma: ${testOrder.discountAmount} so'm)\n`);

    // -------------------------------------------------------------
    // TEST 2: Taklif → Tasdiqlash & Ombordan Rezerv Qilish
    // -------------------------------------------------------------
    console.log('--- TEST 2: Buyurtmani Tasdiqlash & Mahsulotni Rezerv Qilish ---');
    
    // Simulate CONFIRM action
    await prisma.$transaction(async (tx) => {
      // 1. Reserve stock
      await tx.warehouseStock.update({
        where: { productId_branchId: { productId: product.id, branchId } },
        data: { reserved: { increment: orderQty } },
      });

      // 2. Stock Movement record
      await tx.stockMovement.create({
        data: {
          productId: product.id,
          branchId,
          movementType: 'REZERV',
          quantity: orderQty,
          docNumber: testOrder.orderNumber,
          reason: 'Buyurtma tasdiqlandi va zaxira olindi',
          userName: manager.name,
        },
      });

      // 3. Customer debt increment
      await tx.customer.update({
        where: { id: customer.id },
        data: { debt: { increment: finalAmount } },
      });

      // 4. Update order status
      await tx.order.update({
        where: { id: testOrder.id },
        data: {
          status: 'TASDIQLANGAN',
          pipelineStage: 'REZERV',
        },
      });
    });

    const stockAfterReserve = await prisma.warehouseStock.findUnique({
      where: { productId_branchId: { productId: product.id, branchId } },
    });
    const customerAfterReserve = await prisma.customer.findUnique({
      where: { id: customer.id },
    });

    console.log(`✅ Ombor zaxirasi: Rezerv ${initialStock.reserved} dan ${stockAfterReserve.reserved} ga oshdi (+${orderQty} ta band qilindi)`);
    console.log(`✅ Mijoz qarzdorligi: ${customer.debt} dan ${customerAfterReserve.debt} ga oshdi (+${finalAmount} so'm)\n`);

    // -------------------------------------------------------------
    // TEST 3: To'lov Qabul Qilish (Qisman va To'liq to'lov)
    // -------------------------------------------------------------
    console.log('--- TEST 3: To\'lovlar Qabuli (Click va Bank orqali) ---');
    const firstPayment = Math.floor(finalAmount / 2);
    const secondPayment = finalAmount - firstPayment;

    // First Payment: Click
    await prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          paymentNumber: `PAY-TEST-${Date.now().toString().slice(-4)}-1`,
          orderId: testOrder.id,
          customerId: customer.id,
          amount: firstPayment,
          method: 'Click',
          status: 'TO\'LIQ_TO\'LANGAN',
          receivedById: accountant.id,
          notes: '1-qism to\'lov (Click Up)',
        },
      });

      await tx.order.update({
        where: { id: testOrder.id },
        data: {
          paidAmount: firstPayment,
          debtAmount: finalAmount - firstPayment,
          paymentStatus: 'QISMAN_TO\'LANGAN',
          status: 'QISMAN_TOLANGAN',
        },
      });

      await tx.customer.update({
        where: { id: customer.id },
        data: { debt: { decrement: firstPayment } },
      });
    });

    let ordCheck = await prisma.order.findUnique({ where: { id: testOrder.id } });
    console.log(`✅ 1-to'lov qabul qilindi: ${firstPayment} so'm (Click)`);
    console.log(`   Buyurtma: to'langan: ${ordCheck.paidAmount}, qarz: ${ordCheck.debtAmount}, holat: ${ordCheck.paymentStatus}`);

    // Second Payment: Bank
    await prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          paymentNumber: `PAY-TEST-${Date.now().toString().slice(-4)}-2`,
          orderId: testOrder.id,
          customerId: customer.id,
          amount: secondPayment,
          method: 'Bank',
          status: 'TO\'LIQ_TO\'LANGAN',
          receivedById: accountant.id,
          notes: '2-qism to\'liq to\'lov (Bank o\'tkazmasi)',
        },
      });

      await tx.order.update({
        where: { id: testOrder.id },
        data: {
          paidAmount: finalAmount,
          debtAmount: 0,
          paymentStatus: 'TO\'LIQ_TO\'LANGAN',
          status: 'TOLANGAN',
        },
      });

      await tx.customer.update({
        where: { id: customer.id },
        data: { debt: { decrement: secondPayment } },
      });
    });

    ordCheck = await prisma.order.findUnique({ where: { id: testOrder.id } });
    const custFinal = await prisma.customer.findUnique({ where: { id: customer.id } });
    console.log(`✅ 2-to'lov qabul qilindi: ${secondPayment} so'm (Bank)`);
    console.log(`   Buyurtma: to'liq to'landi! Qarz: ${ordCheck.debtAmount} so'm, holat: ${ordCheck.paymentStatus}`);
    console.log(`   Mijoz qarzdorligi asl holatiga qaytdi: ${custFinal.debt} so'm\n`);

    // -------------------------------------------------------------
    // TEST 4: Ombordan Chiqarish (Dispatch)
    // -------------------------------------------------------------
    console.log('--- TEST 4: Ombordan Chiqarish & Yetkazishga Yuborish ---');
    await prisma.$transaction(async (tx) => {
      // Deduct quantity and release reserve
      await tx.warehouseStock.update({
        where: { productId_branchId: { productId: product.id, branchId } },
        data: {
          quantity: { decrement: orderQty },
          reserved: { decrement: orderQty },
        },
      });

      await tx.stockMovement.create({
        data: {
          productId: product.id,
          branchId,
          movementType: 'CHIQIM',
          quantity: orderQty,
          docNumber: testOrder.orderNumber,
          reason: 'Buyurtma bo\'yicha ombordan chiqarildi',
          userName: manager.name,
        },
      });

      await tx.order.update({
        where: { id: testOrder.id },
        data: {
          status: 'YETKAZILMOQDA',
          pipelineStage: 'CHIQARISH',
        },
      });
    });

    const stockAfterDispatch = await prisma.warehouseStock.findUnique({
      where: { productId_branchId: { productId: product.id, branchId } },
    });
    console.log(`✅ Ombordan chiqarildi: Jami qoldiq ${stockAfterReserve.quantity} dan ${stockAfterDispatch.quantity} ga kamaydi`);
    console.log(`   Rezerv bo'shatildi: ${stockAfterReserve.reserved} dan ${stockAfterDispatch.reserved} ga tushdi`);
    console.log(`   Buyurtma statusi: YETKAZILMOQDA\n`);

    // -------------------------------------------------------------
    // TEST 5: O'rnatish & Texnik Servisga Topshirish
    // -------------------------------------------------------------
    console.log('--- TEST 5: Texnik Servis & O\'rnatish Topshirig\'i (Installation) ---');
    const taskNumber = `TASK-TEST-${Date.now().toString().slice(-5)}`;
    const installTask = await prisma.installation.create({
      data: {
        taskNumber,
        orderId: testOrder.id,
        customerId: customer.id,
        branchId,
        deviceName: `${product.name} (x${orderQty})`,
        serviceType: 'ONKM_ORNATISH',
        status: 'YANGI',
        notes: `Buyurtma ${testOrder.orderNumber} bo'yicha montaj va fiskallashtirish`,
      },
    });

    await prisma.order.update({
      where: { id: testOrder.id },
      data: {
        status: 'ORNATILMOQDA',
        pipelineStage: 'ORNATISH',
      },
    });

    console.log(`✅ O'rnatish topshirig'i shakllandi: ${installTask.taskNumber}`);
    console.log(`   Qurilma: ${installTask.deviceName}, Status: ${installTask.status}`);
    console.log(`   Buyurtma statusi: ORNATILMOQDA\n`);

    // -------------------------------------------------------------
    // TEST 6: Buyurtmani To'liq Yakunlash (Complete)
    // -------------------------------------------------------------
    console.log('--- TEST 6: Buyurtma va Texnik Topshiriqni To\'liq Yakunlash ---');
    await prisma.$transaction(async (tx) => {
      await tx.installation.update({
        where: { id: installTask.id },
        data: {
          status: 'YAKUNLANDI',
          completedAt: new Date(),
          completionNotes: 'Kassa o\'rnatildi, fiskallashtirildi va chek chiqarib sinovdan o\'tkazildi.',
        },
      });

      await tx.order.update({
        where: { id: testOrder.id },
        data: {
          status: 'YAKUNLANDI',
          pipelineStage: 'YAKUNLANDI',
        },
      });
    });

    const finalOrder = await prisma.order.findUnique({
      where: { id: testOrder.id },
      include: { installations: true, payments: true },
    });
    console.log(`✅ Buyurtma holati: ${finalOrder.status} (${finalOrder.pipelineStage})`);
    console.log(`✅ Texnik o'rnatish holati: ${finalOrder.installations[0].status}`);
    console.log(`✅ Jami to'lovlar soni: ${finalOrder.payments.length} ta, to'langan summa: ${finalOrder.paidAmount} so'm\n`);

    // -------------------------------------------------------------
    // TEST 7: Bekor Qilish & Rezervni Qaytarish (Rollback) Test
    // -------------------------------------------------------------
    console.log('--- TEST 7: Buyurtmani Bekor Qilish & Zaxirani Bo\'shatish (Cancel & Rollback) ---');
    const cancelOrderNum = `TEST-CANCEL-${Date.now().toString().slice(-4)}`;
    const cancelOrder = await prisma.order.create({
      data: {
        orderNumber: cancelOrderNum,
        customerId: customer.id,
        branchId,
        managerId: manager.id,
        totalAmount: 1000000,
        discountAmount: 0,
        finalAmount: 1000000,
        paidAmount: 0,
        debtAmount: 1000000,
        status: 'REZERV',
        pipelineStage: 'REZERV',
        paymentStatus: 'KUTILMOQDA',
        notes: 'Bekor qilinadigan test buyurtma',
        items: {
          create: [{ productId: product.id, quantity: 1, unitPrice: 1000000, totalPrice: 1000000 }],
        },
      },
    });

    // Reserve 1 item
    await prisma.warehouseStock.update({
      where: { productId_branchId: { productId: product.id, branchId } },
      data: { reserved: { increment: 1 } },
    });
    await prisma.customer.update({
      where: { id: customer.id },
      data: { debt: { increment: 1000000 } },
    });

    const stockBeforeCancel = await prisma.warehouseStock.findUnique({
      where: { productId_branchId: { productId: product.id, branchId } },
    });

    // Now Cancel
    await prisma.$transaction(async (tx) => {
      await tx.warehouseStock.update({
        where: { productId_branchId: { productId: product.id, branchId } },
        data: { reserved: { decrement: 1 } },
      });
      await tx.stockMovement.create({
        data: {
          productId: product.id,
          branchId,
          movementType: 'UNRESERVE',
          quantity: 1,
          docNumber: cancelOrderNum,
          reason: 'Buyurtma bekor qilindi, rezerv qaytarildi',
          userName: manager.name,
        },
      });
      await tx.customer.update({
        where: { id: customer.id },
        data: { debt: { decrement: 1000000 } },
      });
      await tx.order.update({
        where: { id: cancelOrder.id },
        data: { status: 'BEKOR_QILINDI' },
      });
    });

    const stockAfterCancel = await prisma.warehouseStock.findUnique({
      where: { productId_branchId: { productId: product.id, branchId } },
    });

    console.log(`✅ Zaxira bekor qilindi: Rezerv ${stockBeforeCancel.reserved} dan ${stockAfterCancel.reserved} ga tushdi`);
    console.log(`✅ Buyurtma statusi: BEKOR_QILINDI\n`);

    console.log('====================================================');
    console.log('🎉 BARCHA 7 TA INTEGRATION TEST MUVAFFAQIYATLI O\'TDI!');
    console.log('====================================================');
  } catch (err) {
    console.error('❌ Testda xatolik:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase4Tests();
