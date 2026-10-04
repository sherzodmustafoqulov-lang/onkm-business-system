import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { checkPermission } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

// GET /api/orders: Orders list with search, filter, pagination & real-time KPIs
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
    }

    if (!checkPermission(user.role, user.permissions, 'SALES', 'canView')) {
      return NextResponse.json({ error: 'Buyurtmalarni ko\'rish huquqi yo\'q' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q') || '';
    const statusFilter = searchParams.get('status');
    const pipelineFilter = searchParams.get('pipelineStage');
    const paymentStatusFilter = searchParams.get('paymentStatus');
    const branchFilter = searchParams.get('branchId');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '20', 10));
    const skip = (page - 1) * limit;

    const where: any = {};

    // Branch isolation for branch managers
    if (user.role === 'MANAGER' && user.branchId) {
      where.branchId = user.branchId;
    } else if (branchFilter && branchFilter !== 'ALL') {
      where.branchId = branchFilter;
    }

    if (statusFilter && statusFilter !== 'ALL') {
      where.status = statusFilter;
    }

    if (pipelineFilter && pipelineFilter !== 'ALL') {
      where.pipelineStage = pipelineFilter;
    }

    if (paymentStatusFilter && paymentStatusFilter !== 'ALL') {
      where.paymentStatus = paymentStatusFilter;
    }

    if (search.trim()) {
      const q = search.trim();
      where.OR = [
        { orderNumber: { contains: q } },
        { customer: { companyName: { contains: q } } },
        { customer: { inn: { contains: q } } },
        { customer: { phone: { contains: q } } },
        { manager: { name: { contains: q } } },
      ];
    }

    const [total, orders, allOrdersForStats] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              companyName: true,
              inn: true,
              phone: true,
              debt: true,
              companyType: true,
              status: true,
            },
          },
          manager: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  sellingPrice: true,
                  category: { select: { name: true } },
                },
              },
            },
          },
          payments: {
            orderBy: { paidAt: 'desc' },
            select: {
              id: true,
              paymentNumber: true,
              amount: true,
              method: true,
              status: true,
              paidAt: true,
            },
          },
          installations: {
            select: {
              id: true,
              taskNumber: true,
              status: true,
              serviceType: true,
              deviceName: true,
            },
          },
        },
      }),
      // KPI summary calculation across all filtered orders
      prisma.order.findMany({
        where,
        select: {
          finalAmount: true,
          paidAmount: true,
          debtAmount: true,
          status: true,
          pipelineStage: true,
          paymentStatus: true,
        },
      }),
    ]);

    const kpis = {
      totalOrders: allOrdersForStats.length,
      totalAmount: allOrdersForStats.reduce((sum, o) => sum + (o.finalAmount || 0), 0),
      totalPaid: allOrdersForStats.reduce((sum, o) => sum + (o.paidAmount || 0), 0),
      totalDebt: allOrdersForStats.reduce((sum, o) => sum + (o.debtAmount || 0), 0),
      reservedCount: allOrdersForStats.filter((o) => o.status === 'REZERV' || o.pipelineStage === 'REZERV').length,
      activeInstallationCount: allOrdersForStats.filter(
        (o) => o.status === 'ORNATILMOQDA' || o.pipelineStage === 'ORNATISH'
      ).length,
      completedCount: allOrdersForStats.filter(
        (o) => o.status === 'YAKUNLANDI' || o.pipelineStage === 'YAKUNLANDI'
      ).length,
    };

    const managers = await prisma.user.findMany({
      select: { id: true, name: true, email: true, phone: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      orders,
      managers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      kpis,
    });
  } catch (error: any) {
    console.error('GET /api/orders error:', error);
    return NextResponse.json({ error: 'Buyurtmalarni yuklashda xatolik yuz berdi: ' + error.message }, { status: 500 });
  }
}

// POST /api/orders: Create order with stock checks, customer debt update, and ACID transaction
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
    }

    if (!checkPermission(user.role, user.permissions, 'SALES', 'canCreate')) {
      return NextResponse.json({ error: 'Buyurtma yaratish huquqi yo\'q' }, { status: 403 });
    }

    const body = await request.json();
    let {
      customerId,
      companyName,
      contactName,
      phone,
      orderNumber: customOrderNumber,
      title,
      branchId: reqBranchId,
      managerId: reqManagerId,
      pipelineStage = 'BUYURTMA',
      status = 'YANGI',
      deliveryRequired = true,
      installationRequired = true,
      notes = '',
      items = [],
      amount,
    } = body;

    // Support quick customer resolution or creation if customerId not explicitly provided
    let customer: any = null;
    if (customerId) {
      customer = await prisma.customer.findUnique({
        where: { id: customerId },
      });
      if (!customer) {
        return NextResponse.json({ error: 'Mijoz topilmadi' }, { status: 404 });
      }
    } else if (companyName || contactName || phone) {
      // Find matching customer or create lightweight lead customer
      const existing = await prisma.customer.findFirst({
        where: {
          OR: [
            ...(companyName ? [{ companyName: { contains: companyName.trim() } }] : []),
            ...(phone ? [{ phone: { contains: phone.trim() } }] : []),
          ],
        },
      });

      if (existing) {
        customer = existing;
        customerId = existing.id;
      } else {
        // Resolve default branch
        const defaultBranch = await prisma.branch.findFirst();
        const branchIdToUse = reqBranchId || user.branchId || defaultBranch?.id;
        if (!branchIdToUse) {
          return NextResponse.json({ error: 'Filial topilmadi' }, { status: 400 });
        }

        const cleanInn = 'L' + Date.now().toString().slice(-8);
        customer = await prisma.customer.create({
          data: {
            companyName: companyName?.trim() || contactName?.trim() || 'Yangi Lid Mijoz',
            contactPerson: contactName?.trim() || '',
            inn: cleanInn,
            phone: phone?.trim() || '+998900000000',
            address: 'Manzil ko\'rsatilmagan',
            branchId: branchIdToUse,
            managerId: reqManagerId || user.id,
            status: 'POTENTSIAL',
          },
        });
        customerId = customer.id;
      }
    } else {
      return NextResponse.json({ error: 'Mijoz yoki kontakt ma\'lumoti kiritilishi shart' }, { status: 400 });
    }

    const branchId = reqBranchId || customer.branchId || user.branchId;
    if (!branchId) {
      return NextResponse.json({ error: 'Filial aniqlanmadi' }, { status: 400 });
    }

    const managerId = reqManagerId || user.id;

    // Check if items provided or if this is a quick deal / lead
    let totalAmount = 0;
    let totalDiscount = 0;
    let validatedItems: any[] = [];

    if (Array.isArray(items) && items.length > 0) {
      const productIds = items.map((it: any) => it.productId).filter(Boolean);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
      });
      const productMap = new Map(products.map((p) => [p.id, p]));

      validatedItems = items.map((it: any) => {
        const prod = productMap.get(it.productId);
        if (!prod) {
          throw new Error(`Mahsulot topilmadi: ${it.productId}`);
        }
        const qty = Math.max(1, parseInt(it.quantity || '1', 10));
        const price = typeof it.unitPrice === 'number' && it.unitPrice >= 0 ? it.unitPrice : prod.sellingPrice;
        const discount = typeof it.discount === 'number' && it.discount >= 0 ? it.discount : 0;
        const lineTotal = Math.max(0, qty * price - discount);

        totalAmount += qty * price;
        totalDiscount += discount;

        return {
          productId: prod.id,
          productName: prod.name,
          quantity: qty,
          unitPrice: price,
          discount,
          totalPrice: lineTotal,
        };
      });
    } else {
      // Quick Deal mode without items
      const parsedAmount = typeof amount === 'number' ? amount : (parseFloat(amount) || 0);
      totalAmount = Math.max(0, parsedAmount);
      totalDiscount = 0;
    }

    const finalAmount = Math.max(0, totalAmount - totalDiscount);
    const debtAmount = finalAmount;
    const paidAmount = 0;
    const paymentStatus = 'KUTILMOQDA';

    // Execute atomic transaction
    const newOrder = await prisma.$transaction(async (tx) => {
      // 1. Generate sequential order number or use custom title
      const year = new Date().getFullYear();
      let orderNumber = customOrderNumber || title;
      if (!orderNumber || !orderNumber.trim()) {
        const orderCount = await tx.order.count();
        orderNumber = `ORD-${year}-${String(orderCount + 1).padStart(4, '0')}`;
      } else {
        orderNumber = orderNumber.trim();
        const exists = await tx.order.findUnique({ where: { orderNumber } });
        if (exists) {
          orderNumber = `${orderNumber}-${Math.floor(100 + Math.random() * 900)}`;
        }
      }

      const shouldReserveStock =
        status === 'REZERV' ||
        status === 'TASDIQLANGAN' ||
        pipelineStage === 'REZERV';

      // 2. Check and reserve stock if order is confirmed/reserved right away
      if (shouldReserveStock) {
        for (const item of validatedItems) {
          const stock = await tx.warehouseStock.findUnique({
            where: {
              productId_branchId: {
                productId: item.productId,
                branchId,
              },
            },
          });

          const available = (stock?.quantity || 0) - (stock?.reserved || 0);
          if (available < item.quantity) {
            throw new Error(
              `"${item.productName}" uchun omborda yetarli qoldiq mavjud emas! (Mavjud: ${available}, Talab: ${item.quantity})`
            );
          }

          // Update stock reservation
          await tx.warehouseStock.upsert({
            where: {
              productId_branchId: {
                productId: item.productId,
                branchId,
              },
            },
            create: {
              productId: item.productId,
              branchId,
              quantity: 0,
              reserved: item.quantity,
            },
            update: {
              reserved: { increment: item.quantity },
            },
          });

          // Stock movement record
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              branchId,
              movementType: 'REZERV',
              quantity: item.quantity,
              price: item.unitPrice,
              docNumber: orderNumber,
              reason: `Buyurtma ${orderNumber} uchun zaxira (rezerv) qilindi`,
              userName: user.name,
            },
          });
        }
      }

      // 3. Increment customer debt if not a draft/lead
      const isLeadOrProposal = pipelineStage === 'LEAD' || pipelineStage === 'TAKLIF' || pipelineStage === 'MIJOZ_TOLANMAGAN';
      if (!isLeadOrProposal && status !== 'BEKOR_QILINDI') {
        await tx.customer.update({
          where: { id: customerId },
          data: {
            debt: { increment: finalAmount },
          },
        });
      }

      // 4. Create Order
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId,
          branchId,
          managerId,
          totalAmount,
          discountAmount: totalDiscount,
          finalAmount,
          paidAmount,
          debtAmount,
          status,
          pipelineStage,
          paymentStatus,
          deliveryRequired: Boolean(deliveryRequired),
          installationRequired: Boolean(installationRequired),
          notes,
          items: {
            create: validatedItems.map((v) => ({
              productId: v.productId,
              quantity: v.quantity,
              unitPrice: v.unitPrice,
              discount: v.discount,
              totalPrice: v.totalPrice,
            })),
          },
        },
        include: {
          customer: true,
          branch: true,
          manager: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      // 5. If installation is required and status is already installation
      if (installationRequired && (status === 'ORNATILMOQDA' || pipelineStage === 'ORNATISH')) {
        const taskNumber = `TASK-${year}-${String(Date.now()).slice(-5)}`;
        await tx.installation.create({
          data: {
            taskNumber,
            orderId: createdOrder.id,
            customerId,
            branchId,
            deviceName: validatedItems.map((i) => i.productName).join(', '),
            serviceType: 'ONKM_ORNATISH',
            status: 'YANGI',
            notes: `Buyurtma ${orderNumber} uchun o'rnatish topshirig'i`,
          },
        });
      }

      // 6. Audit log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          userName: user.name,
          action: 'CREATE',
          entity: 'Order',
          entityId: createdOrder.id,
          newValue: JSON.stringify({
            orderNumber,
            customer: customer.companyName,
            finalAmount,
            status,
            pipelineStage,
          }),
        },
      });

      return createdOrder;
    });

    return NextResponse.json({
      success: true,
      message: `Buyurtma muvaffaqiyatli shakllantirildi: ${newOrder.orderNumber}`,
      order: newOrder,
    }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/orders error:', error);
    return NextResponse.json({ error: error.message || 'Buyurtma yaratishda xatolik' }, { status: 400 });
  }
}
