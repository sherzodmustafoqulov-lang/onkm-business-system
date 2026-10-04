import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const branchFilter = searchParams.get('branchId');

    const branchCondition = branchFilter && branchFilter !== 'ALL' ? { branchId: branchFilter } : {};

    // 1. Calculations
    const [
      totalProducts,
      productsWithStock,
      totalSerials,
      fmStats,
      branchesWithStock,
      recentMovements,
    ] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.findMany({
        where: { isActive: true },
        include: {
          stock: branchFilter && branchFilter !== 'ALL' ? { where: { branchId: branchFilter } } : true,
          category: true,
        },
      }),
      prisma.productSerial.count({ where: branchCondition }),
      prisma.fiscalModule.findMany({
        where: branchCondition,
        select: { status: true },
      }),
      prisma.branch.findMany({
        where: { isActive: true },
        include: {
          warehouseStock: true,
          _count: {
            select: {
              productSerials: true,
              fiscalModules: true,
            },
          },
        },
      }),
      prisma.stockMovement.findMany({
        where: branchCondition,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { name: true, sku: true } },
          branch: { select: { name: true } },
        },
      }),
    ]);

    // Financial valuation of stock
    let totalStockValuePurchase = 0;
    let totalStockValueSelling = 0;
    let lowStockCount = 0;
    let totalStockUnits = 0;

    for (const p of productsWithStock) {
      const sumQty = p.stock.reduce((acc, s) => acc + s.quantity, 0);
      totalStockUnits += sumQty;
      totalStockValuePurchase += sumQty * p.purchasePrice;
      totalStockValueSelling += sumQty * p.sellingPrice;

      if (sumQty <= p.minStock) {
        lowStockCount++;
      }
    }

    // FM breakdown
    const fmBreakdown = {
      total: fmStats.length,
      inStock: fmStats.filter((f) => f.status === 'OMBORDA').length,
      active: fmStats.filter((f) => ['FAOL', 'O\'RNATILDI', 'MIJOZGA_BERILDI'].includes(f.status)).length,
      reserved: fmStats.filter((f) => f.status === 'REZERV').length,
      defect: fmStats.filter((f) => f.status === 'NOSOZ').length,
    };

    return NextResponse.json({
      totalProducts,
      lowStockCount,
      totalStockUnits,
      totalValuePurchase: totalStockValuePurchase,
      totalValueSelling: totalStockValueSelling,
      branchesStock: branchesWithStock.map((b) => ({
        id: b.id,
        name: b.name,
        code: b.code,
        isMain: b.code === 'MAIN' || b.name.includes('Bosh'),
        totalUnits: b.warehouseStock.reduce((acc, s) => acc + s.quantity, 0),
        totalValuePurchase: b.warehouseStock.reduce((acc, s) => acc + s.quantity * 1000000, 0),
      })),
      fmStats: {
        total: fmBreakdown.total,
        inStock: fmBreakdown.inStock,
        active: fmBreakdown.active,
        reserved: fmBreakdown.reserved,
        broken: fmBreakdown.defect,
        byStatus: {},
      },
      kpis: {
        totalProducts,
        totalStockUnits,
        lowStockCount,
        totalStockValuePurchase,
        totalStockValueSelling,
        totalSerials,
        fmBreakdown,
      },
      branchesWithStock: branchesWithStock.map((b) => ({
        id: b.id,
        name: b.name,
        code: b.code,
        totalQuantity: b.warehouseStock.reduce((acc, s) => acc + s.quantity, 0),
        totalSerials: b._count.productSerials,
        totalFM: b._count.fiscalModules,
      })),
      recentMovements,
    });
  } catch (error) {
    console.error('Warehouse stats error:', error);
    return NextResponse.json({ error: 'Ombor statistikasini yuklashda xatolik' }, { status: 500 });
  }
}
