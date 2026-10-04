import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/customers: List with Search, Filter & Pagination + RBAC
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q') || '';
    const branchFilter = searchParams.get('branchId');
    const statusFilter = searchParams.get('status');
    const ofdFilter = searchParams.get('ofdStatus');
    const debtFilter = searchParams.get('debtOnly') === 'true';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10', 10));
    const skip = (page - 1) * limit;

    // RBAC: If manager has specific branch assigned, restrict to their branch unless admin
    const where: any = {
      deletedAt: null,
    };

    if (user.role === 'MANAGER' && user.branchId) {
      where.branchId = user.branchId;
    } else if (branchFilter && branchFilter !== 'ALL') {
      where.branchId = branchFilter;
    }

    if (statusFilter && statusFilter !== 'ALL') {
      where.status = statusFilter;
    }

    if (ofdFilter && ofdFilter !== 'ALL') {
      where.ofdStatus = ofdFilter;
    }

    if (debtFilter) {
      where.debt = { gt: 0 };
    }

    if (search.trim()) {
      const q = search.trim();
      where.OR = [
        { companyName: { contains: q } },
        { inn: { contains: q } },
        { phone: { contains: q } },
        { contactPerson: { contains: q } },
        { director: { contains: q } },
        { tradeMark: { contains: q } },
      ];
    }

    const [total, customers] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          branch: { select: { id: true, name: true, code: true } },
          manager: { select: { id: true, name: true } },
          productSerials: { select: { serialNumber: true } },
          fiscalModules: { select: { serialNumber: true, kkmSerialNumber: true } },
          _count: {
            select: {
              orders: true,
              productSerials: true,
              fiscalModules: true,
              supportTickets: true,
              installations: true,
              outlets: true,
              contracts: true,
            },
          },
        },
      }),
    ]);

    const mappedCustomers = customers.map((c: any) => {
      const onkmList = c.productSerials || [];
      const fmList = c.fiscalModules || [];
      let pairedDevices = 0;
      if (onkmList.length > 0 && fmList.length > 0) {
        const onkmSerials = new Set(onkmList.map((s: any) => s.serialNumber?.trim().toLowerCase()));
        const matched = fmList.filter((fm: any) =>
          fm.kkmSerialNumber && onkmSerials.has(fm.kkmSerialNumber.trim().toLowerCase())
        ).length;
        pairedDevices = matched > 0 ? matched : Math.min(onkmList.length, fmList.length);
      }
      return {
        ...c,
        pairedDevices,
      };
    });

    return NextResponse.json({
      customers: mappedCustomers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Customers GET error:', error);
    return NextResponse.json({ error: 'Mijozlarni yuklashda xatolik' }, { status: 500 });
  }
}

// POST /api/customers: Create new customer + AuditLog
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
    }

    // Role check: Only ADMIN and MANAGER can create customers
    if (!['ADMIN', 'MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Mijoz yaratish huquqiga ega emassiz' }, { status: 403 });
    }

    const body = await request.json();
    const {
      companyName,
      inn,
      companyType,
      legalStatus,
      tradeMark,
      activityType,
      oked,
      address,
      phone,
      email,
      bank,
      accountNumber,
      mfo,
      director,
      contactPerson,
      branchId,
      status,
      ofdStatus,
      initialDebt,
    } = body;

    if (!companyName || !inn || !address || !phone || !branchId) {
      return NextResponse.json(
        { error: 'Kompaniya nomi, STIR (INN), manzil, telefon va filial to\'ldirilishi shart' },
        { status: 400 }
      );
    }

    // Check if INN already exists
    const existing = await prisma.customer.findUnique({
      where: { inn: inn.trim() },
    });

    if (existing && !existing.deletedAt) {
      return NextResponse.json(
        { error: `Ushbu STIR (${inn}) bo'yicha mijoz allaqachon mavjud: ${existing.companyName}` },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.create({
      data: {
        companyName: companyName.trim(),
        inn: inn.trim(),
        companyType: companyType || 'MCHJ',
        legalStatus: legalStatus || 'Faol',
        tradeMark: tradeMark?.trim() || null,
        activityType: activityType?.trim() || null,
        oked: oked?.trim() || null,
        address: address.trim(),
        phone: phone.trim(),
        email: email?.trim() || null,
        bank: bank?.trim() || null,
        accountNumber: accountNumber?.trim() || null,
        mfo: mfo?.trim() || null,
        director: director?.trim() || null,
        contactPerson: contactPerson?.trim() || null,
        branchId: branchId,
        managerId: user.id,
        status: status || 'FAOL',
        ofdStatus: ofdStatus || 'ULANGAN',
        debt: Number(initialDebt) || 0,
      },
    });

    // Write audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          userName: user.name,
          action: 'CREATE',
          entity: 'Customer',
          entityId: customer.id,
          newValue: `Yangi mijoz qo'shildi: ${customer.companyName} (STIR: ${customer.inn})`,
        },
      });
    } catch (auditErr) {
      console.warn('Audit error:', auditErr);
    }

    return NextResponse.json({ success: true, customer }, { status: 201 });
  } catch (error) {
    console.error('Customer POST error:', error);
    return NextResponse.json({ error: 'Mijoz yaratishda xatolik yuz berdi' }, { status: 500 });
  }
}
