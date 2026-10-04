import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/warehouse/movements
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const branchId = searchParams.get('branchId');
    const search = searchParams.get('q') || '';

    const where: any = {};

    if (type && type !== 'ALL') {
      where.movementType = type;
    }

    if (branchId && branchId !== 'ALL') {
      where.branchId = branchId;
    }

    if (search.trim()) {
      const q = search.trim();
      where.OR = [
        { product: { name: { contains: q } } },
        { product: { sku: { contains: q } } },
        { docNumber: { contains: q } },
        { reason: { contains: q } },
        { serialNumbers: { contains: q } },
      ];
    }

    const movements = await prisma.stockMovement.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, sku: true, unit: true } },
        branch: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ movements });
  } catch (error) {
    console.error('Movements GET error:', error);
    return NextResponse.json({ error: 'Harakatlarni yuklashda xatolik' }, { status: 500 });
  }
}

// POST /api/warehouse/movements: Perform validated stock movement with anti-negative check
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
    }

    if (!['ADMIN', 'WAREHOUSE'].includes(user.role)) {
      return NextResponse.json({ error: 'Ombor harakatlarini amalga oshirish huquqiga ega emassiz' }, { status: 403 });
    }

    const body = await request.json();
    const {
      productId,
      branchId,
      targetBranchId,
      movementType, // KIRIM, CHIQIM, TRANSFER, REZERV, UNRESERVE, MIJOZGA_BERISH, QAYTARISH, INVENTARIZATSIYA
      quantity,
      price,
      serialNumbers,
      reason,
      docNumber,
      allowNegativeOverride,
    } = body;

    const qty = Math.abs(parseInt(quantity, 10));
    if (!productId || !branchId || !movementType || !qty || qty <= 0) {
      return NextResponse.json({ error: 'Barcha majburiy maydonlar to\'g\'ri to\'ldirilishi shart' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: 'Mahsulot topilmadi' }, { status: 404 });
    }

    // Current stock in source branch
    const currentStock = await prisma.warehouseStock.findUnique({
      where: {
        productId_branchId: {
          productId,
          branchId,
        },
      },
    });

    const currentQty = currentStock?.quantity || 0;
    const currentReserved = currentStock?.reserved || 0;

    // Anti-Negative Stock Check (Non-admin or admin without override)
    const isDeduction = ['CHIQIM', 'TRANSFER', 'REZERV', 'MIJOZGA_BERISH'].includes(movementType);
    if (isDeduction && currentQty < qty) {
      if (user.role !== 'ADMIN' || !allowNegativeOverride) {
        return NextResponse.json(
          {
            error: `Omborda yetarli qoldiq mavjud emas! (Mavjud: ${currentQty} ${product.unit}, so'ralgan: ${qty} ${product.unit}). Negative stock taqiqlangan.`,
          },
          { status: 400 }
        );
      }
    }

    // Process movements
    let newQty = currentQty;
    let newReserved = currentReserved;

    switch (movementType) {
      case 'KIRIM':
      case 'QAYTARISH':
        newQty += qty;
        break;

      case 'CHIQIM':
        newQty -= qty;
        break;

      case 'REZERV':
        newReserved += qty;
        break;

      case 'UNRESERVE':
        newReserved = Math.max(0, newReserved - qty);
        break;

      case 'MIJOZGA_BERISH':
        newQty -= qty;
        newReserved = Math.max(0, newReserved - qty);
        break;

      case 'INVENTARIZATSIYA':
        // Direct set to real physical count
        newQty = qty;
        break;

      case 'TRANSFER':
        if (!targetBranchId || targetBranchId === branchId) {
          return NextResponse.json({ error: 'O\'tkaziladigan qabul qiluvchi filialni to\'g\'ri tanlang' }, { status: 400 });
        }
        newQty -= qty;

        // Increase quantity in target branch
        await prisma.warehouseStock.upsert({
          where: {
            productId_branchId: {
              productId,
              branchId: targetBranchId,
            },
          },
          update: { quantity: { increment: qty } },
          create: {
            productId,
            branchId: targetBranchId,
            quantity: qty,
            reserved: 0,
            minStock: product.minStock,
          },
        });
        break;

      default:
        return NextResponse.json({ error: 'Noma\'lum harakat turi' }, { status: 400 });
    }

    // Update source warehouse stock
    await prisma.warehouseStock.upsert({
      where: {
        productId_branchId: {
          productId,
          branchId,
        },
      },
      update: {
        quantity: newQty,
        reserved: newReserved,
      },
      create: {
        productId,
        branchId,
        quantity: newQty,
        reserved: newReserved,
        minStock: product.minStock,
      },
    });

    // Record Stock Movement entry
    const movement = await prisma.stockMovement.create({
      data: {
        productId,
        branchId,
        targetBranchId: targetBranchId || null,
        movementType,
        quantity: qty,
        price: Number(price) || product.purchasePrice,
        serialNumbers: serialNumbers?.trim() || null,
        reason: reason?.trim() || null,
        docNumber: docNumber?.trim() || `DOC-${Date.now().toString().slice(-6)}`,
        userName: user.name,
      },
      include: {
        product: true,
        branch: true,
      },
    });

    // Write Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          userName: user.name,
          action: 'STOCK_MOVEMENT',
          entity: 'WarehouseStock',
          entityId: movement.id,
          newValue: `${movementType}: ${product.name} x ${qty} ${product.unit} (${movement.branch.name})`,
        },
      });
    } catch (auditErr) {
      console.warn('Audit error:', auditErr);
    }

    return NextResponse.json({
      success: true,
      movement,
      updatedStock: {
        productId,
        branchId,
        quantity: newQty,
        reserved: newReserved,
      },
    });
  } catch (error) {
    console.error('Movement POST error:', error);
    return NextResponse.json({ error: 'Ombor harakatini bajarishda xatolik' }, { status: 500 });
  }
}
