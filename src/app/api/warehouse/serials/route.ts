import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/warehouse/serials
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q') || '';
    const status = searchParams.get('status');
    const branchId = searchParams.get('branchId');
    const productId = searchParams.get('productId');

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (branchId && branchId !== 'ALL') {
      where.branchId = branchId;
    }

    if (productId && productId !== 'ALL') {
      where.productId = productId;
    }

    if (search.trim()) {
      const q = search.trim();
      where.OR = [
        { serialNumber: { contains: q } },
        { product: { name: { contains: q } } },
        { customer: { companyName: { contains: q } } },
      ];
    }

    const serials = await prisma.productSerial.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, sku: true, model: true } },
        branch: { select: { id: true, name: true, code: true } },
        customer: { select: { id: true, companyName: true, phone: true } },
        history: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ serials });
  } catch (error) {
    console.error('Serials GET error:', error);
    return NextResponse.json({ error: 'Seriya raqamlarini yuklashda xatolik' }, { status: 500 });
  }
}

// POST /api/warehouse/serials: Add single or bulk serial numbers
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
    }

    if (!['ADMIN', 'WAREHOUSE'].includes(user.role)) {
      return NextResponse.json({ error: 'Seriya raqami kiritish huquqiga ega emassiz' }, { status: 403 });
    }

    const body = await request.json();
    const { productId, branchId, serialNumbers, notes, warrantyMonths } = body;

    if (!productId || !branchId || !serialNumbers) {
      return NextResponse.json({ error: 'Mahsulot, filial va seriya raqamlari kiritilishi shart' }, { status: 400 });
    }

    // Split serial numbers by comma, space or newline
    const rawList = String(serialNumbers)
      .split(/[\n,;]+/)
      .map((s) => s.trim().toUpperCase())
      .filter((s) => s.length > 0);

    if (rawList.length === 0) {
      return NextResponse.json({ error: 'Kamida bitta seriya raqami kiritilishi shart' }, { status: 400 });
    }

    // Check existing serials
    const existing = await prisma.productSerial.findMany({
      where: { serialNumber: { in: rawList } },
      select: { serialNumber: true },
    });

    if (existing.length > 0) {
      return NextResponse.json(
        { error: `Quyidagi seriya raqamlari allaqachon mavjud: ${existing.map((e) => e.serialNumber).join(', ')}` },
        { status: 400 }
      );
    }

    const branch = await prisma.branch.findUnique({ where: { id: branchId } });
    const product = await prisma.product.findUnique({ where: { id: productId } });

    const warrantyEnd = new Date();
    warrantyEnd.setMonth(warrantyEnd.getMonth() + (Number(warrantyMonths) || product?.warrantyMonths || 12));

    const createdSerials = [];
    for (const sn of rawList) {
      const serial = await prisma.productSerial.create({
        data: {
          productId,
          branchId,
          serialNumber: sn,
          status: 'OMBORDA',
          warrantyEndDate: warrantyEnd,
          notes: notes?.trim() || null,
          history: {
            create: {
              fromStatus: 'YANGI',
              toStatus: 'OMBORDA',
              toBranch: branch?.name || 'Ombor',
              action: 'KIRIM',
              userName: user.name,
              notes: 'Yangi mahsulot partiyasida kirim qilindi',
            },
          },
        },
      });
      createdSerials.push(serial);
    }

    // Automatically increase WarehouseStock quantity
    await prisma.warehouseStock.upsert({
      where: {
        productId_branchId: {
          productId,
          branchId,
        },
      },
      update: {
        quantity: { increment: createdSerials.length },
      },
      create: {
        productId,
        branchId,
        quantity: createdSerials.length,
        reserved: 0,
        minStock: product?.minStock || 5,
      },
    });

    // Record Stock Movement
    await prisma.stockMovement.create({
      data: {
        productId,
        branchId,
        movementType: 'KIRIM',
        quantity: createdSerials.length,
        price: product?.purchasePrice || 0,
        serialNumbers: rawList.join(', '),
        reason: `Seriya raqamlari kirimi (${createdSerials.length} dona)`,
        docNumber: `KIR-SN-${Date.now().toString().slice(-6)}`,
        userName: user.name,
      },
    });

    return NextResponse.json({
      success: true,
      count: createdSerials.length,
      serials: createdSerials,
    });
  } catch (error) {
    console.error('Serials POST error:', error);
    return NextResponse.json({ error: 'Seriya raqamlarini saqlashda xatolik' }, { status: 500 });
  }
}
