import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/warehouse/products
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q') || '';
    const categoryId = searchParams.get('categoryId');
    const branchId = searchParams.get('branchId');
    const lowStockOnly = searchParams.get('lowStockOnly') === 'true';

    const where: any = {
      isActive: true,
    };

    if (categoryId && categoryId !== 'ALL') {
      where.categoryId = categoryId;
    }

    if (search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { sku: { contains: q } },
        { model: { contains: q } },
        { manufacturer: { contains: q } },
      ];
    }

    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, code: true } },
          stock: branchId && branchId !== 'ALL'
            ? { where: { branchId }, include: { branch: { select: { name: true, code: true } } } }
            : { include: { branch: { select: { name: true, code: true } } } },
          _count: {
            select: {
              serials: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.productCategory.findMany({
        orderBy: { name: 'asc' },
      }),
    ]);

    const branches = await prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    // Calculate total quantities per product
    let result = products.map((p) => {
      const totalQty = p.stock.reduce((acc, s) => acc + s.quantity, 0);
      const totalReserved = p.stock.reduce((acc, s) => acc + s.reserved, 0);
      const available = Math.max(0, totalQty - totalReserved);
      const isLowStock = totalQty <= p.minStock;

      return {
        ...p,
        totalStock: totalQty,
        totalQuantity: totalQty,
        totalReserved,
        available,
        isLowStock,
        stocks: p.stock,
      };
    });

    if (lowStockOnly) {
      result = result.filter((p) => p.isLowStock);
    }

    return NextResponse.json({
      products: result,
      categories,
      branches,
    });
  } catch (error) {
    console.error('Products GET error:', error);
    return NextResponse.json({ error: 'Mahsulotlarni yuklashda xatolik' }, { status: 500 });
  }
}

// POST /api/warehouse/products
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
    }

    if (!['ADMIN', 'WAREHOUSE', 'MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Mahsulot yaratish huquqiga ega emassiz' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      sku,
      categoryId,
      manufacturer,
      model,
      purchasePrice,
      sellingPrice,
      minStock,
      unit,
      hasSerial,
      warrantyMonths,
      initialBranchId,
      initialQuantity,
    } = body;

    if (!name || !sku || !categoryId) {
      return NextResponse.json({ error: 'Nomi, SKU va kategoriya to\'ldirilishi shart' }, { status: 400 });
    }

    // Check SKU duplicate
    const existing = await prisma.product.findUnique({
      where: { sku: sku.trim() },
    });

    if (existing) {
      return NextResponse.json({ error: `Ushbu SKU (${sku}) bilan mahsulot allaqachon mavjud` }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        categoryId,
        manufacturer: manufacturer?.trim() || null,
        model: model?.trim() || null,
        purchasePrice: Number(purchasePrice) || 0,
        sellingPrice: Number(sellingPrice) || 0,
        minStock: Number(minStock) || 5,
        unit: unit || 'dona',
        hasSerial: Boolean(hasSerial),
        warrantyMonths: Number(warrantyMonths) || 12,
      },
    });

    // If initial quantity is given for a branch
    const initQty = Number(initialQuantity) || 0;
    if (initialBranchId && initQty > 0) {
      await prisma.warehouseStock.upsert({
        where: {
          productId_branchId: {
            productId: product.id,
            branchId: initialBranchId,
          },
        },
        update: { quantity: initQty },
        create: {
          productId: product.id,
          branchId: initialBranchId,
          quantity: initQty,
          reserved: 0,
          minStock: product.minStock,
        },
      });

      // Record KIRIM movement
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          branchId: initialBranchId,
          movementType: 'KIRIM',
          quantity: initQty,
          price: product.purchasePrice,
          reason: 'Yangi mahsulot boshlang\'ich partiyasi kirimi',
          docNumber: `KIR-${product.sku}`,
          userName: user.name,
        },
      });
    }

    // Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          userName: user.name,
          action: 'CREATE',
          entity: 'Product',
          entityId: product.id,
          newValue: `Yangi mahsulot yaratildi: ${product.name} (SKU: ${product.sku})`,
        },
      });
    } catch (auditErr) {
      console.warn('Audit error:', auditErr);
    }

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error) {
    console.error('Products POST error:', error);
    return NextResponse.json({ error: 'Mahsulot saqlashda xatolik yuz berdi' }, { status: 500 });
  }
}
