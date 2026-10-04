import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/warehouse/fiscal-modules
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

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (branchId && branchId !== 'ALL') {
      where.branchId = branchId;
    }

    if (search.trim()) {
      const q = search.trim();
      where.OR = [
        { serialNumber: { contains: q } },
        { kkmSerialNumber: { contains: q } },
        { customer: { companyName: { contains: q } } },
      ];
    }

    const fiscalModules = await prisma.fiscalModule.findMany({
      where,
      include: {
        branch: { select: { id: true, name: true, code: true } },
        customer: { select: { id: true, companyName: true, phone: true } },
        movements: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ fiscalModules });
  } catch (error) {
    console.error('FM GET error:', error);
    return NextResponse.json({ error: 'Fiskal modullarni yuklashda xatolik' }, { status: 500 });
  }
}

// POST /api/warehouse/fiscal-modules: Add or update FM status
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
    }

    if (!['ADMIN', 'WAREHOUSE'].includes(user.role)) {
      return NextResponse.json({ error: 'Fiskal modul kiritish huquqiga ega emassiz' }, { status: 403 });
    }

    const body = await request.json();
    const { serialNumber, branchId, status, customerId, kkmSerialNumber, notes, actionType } = body;

    if (!serialNumber || !branchId) {
      return NextResponse.json({ error: 'FM seriya raqami va filial tanlanishi shart' }, { status: 400 });
    }

    const cleanSerial = serialNumber.trim().toUpperCase();

    // Check if exists
    const existing = await prisma.fiscalModule.findUnique({
      where: { serialNumber: cleanSerial },
    });

    let fm;
    if (existing) {
      // Update existing FM status
      fm = await prisma.fiscalModule.update({
        where: { serialNumber: cleanSerial },
        data: {
          branchId,
          status: status || existing.status,
          customerId: customerId !== undefined ? customerId : existing.customerId,
          kkmSerialNumber: kkmSerialNumber !== undefined ? kkmSerialNumber : existing.kkmSerialNumber,
          notes: notes?.trim() || existing.notes,
        },
      });

      // Record History Movement
      await prisma.fiscalModuleHistory.create({
        data: {
          fiscalModuleId: fm.id,
          fromLocation: existing.status,
          toLocation: status || existing.status,
          action: actionType || 'STATUS_O\'ZGARDi',
          userId: user.id,
          notes: notes || `FM holati o'zgartirildi: ${status}`,
        },
      });
    } else {
      // Create new FM
      fm = await prisma.fiscalModule.create({
        data: {
          serialNumber: cleanSerial,
          branchId,
          status: status || 'OMBORDA',
          customerId: customerId || null,
          kkmSerialNumber: kkmSerialNumber?.trim() || null,
          registeredAt: new Date(),
          warrantyEndDate: new Date(Date.now() + 365 * 24 * 3600 * 1000), // 1 year
          notes: notes?.trim() || null,
          movements: {
            create: {
              fromLocation: 'YETKAZIB_BERUVCHI',
              toLocation: 'OMBORDA',
              action: 'KIRIM',
              userId: user.id,
              notes: 'Yangi fiskal modul omborga qabul qilindi',
            },
          },
        },
      });
    }

    // Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          userName: user.name,
          action: existing ? 'UPDATE' : 'CREATE',
          entity: 'FiscalModule',
          entityId: fm.id,
          newValue: `FM harakati: ${fm.serialNumber} (${fm.status})`,
        },
      });
    } catch (auditErr) {
      console.warn('Audit error:', auditErr);
    }

    return NextResponse.json({ success: true, fiscalModule: fm });
  } catch (error) {
    console.error('FM POST error:', error);
    return NextResponse.json({ error: 'Fiskal modulni saqlashda xatolik' }, { status: 500 });
  }
}
