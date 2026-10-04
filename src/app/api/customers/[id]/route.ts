import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/customers/[id]: Fetch complete detail for all 17 tabs
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
    }

    const { id } = params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        branch: true,
        manager: { select: { id: true, name: true, phone: true, email: true } },
        contacts: { orderBy: { isMain: 'desc' } },
        outlets: { orderBy: { createdAt: 'desc' } },
        contracts: { orderBy: { createdAt: 'desc' } },
        documents: { orderBy: { createdAt: 'desc' } },
        invoices: { orderBy: { createdAt: 'desc' } },
        services: { orderBy: { createdAt: 'desc' } },
        cases: { orderBy: { createdAt: 'desc' } },
        terminals: { orderBy: { createdAt: 'desc' } },
        posSystems: { orderBy: { createdAt: 'desc' } },
        orders: {
          orderBy: { createdAt: 'desc' },
          include: { items: { include: { product: true } } },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          include: { receivedBy: { select: { name: true } } },
        },
        productSerials: {
          orderBy: { createdAt: 'desc' },
          include: { product: { include: { category: true } } },
        },
        fiscalModules: {
          orderBy: { createdAt: 'desc' },
          include: { movements: true },
        },
        installations: {
          orderBy: { createdAt: 'desc' },
          include: { technician: { select: { name: true, phone: true } } },
        },
        supportTickets: {
          orderBy: { createdAt: 'desc' },
          include: {
            assignedTo: { select: { name: true } },
            messages: { take: 5, orderBy: { createdAt: 'desc' } },
          },
        },
      },
    });

    if (!customer || customer.deletedAt) {
      return NextResponse.json({ error: 'Mijoz topilmadi' }, { status: 404 });
    }

    // RBAC: Check manager access
    if (user.role === 'MANAGER' && user.branchId && customer.branchId !== user.branchId) {
      return NextResponse.json({ error: 'Sizda ushbu mijozni ko\'rish huquqi yo\'q' }, { status: 403 });
    }

    // Customer history from AuditLog
    const history = await prisma.auditLog.findMany({
      where: {
        entity: 'Customer',
        entityId: customer.id,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // All available services catalog from database
    const allServicesCatalog = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });

    return NextResponse.json({
      customer,
      history,
      allServicesCatalog,
    });
  } catch (error) {
    console.error('Customer Detail GET error:', error);
    return NextResponse.json({ error: 'Mijoz ma\'lumotlarini yuklashda xatolik' }, { status: 500 });
  }
}

// PUT /api/customers/[id]: Update customer info + AuditLog
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
    }

    if (!['ADMIN', 'MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Mijozni tahrirlash huquqiga ega emassiz' }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();

    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      return NextResponse.json({ error: 'Mijoz topilmadi' }, { status: 404 });
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        companyName: body.companyName ?? existing.companyName,
        inn: body.inn ?? existing.inn,
        companyType: body.companyType ?? existing.companyType,
        legalStatus: body.legalStatus ?? existing.legalStatus,
        tradeMark: body.tradeMark ?? existing.tradeMark,
        activityType: body.activityType ?? existing.activityType,
        oked: body.oked ?? existing.oked,
        address: body.address ?? existing.address,
        phone: body.phone ?? existing.phone,
        email: body.email ?? existing.email,
        bank: body.bank ?? existing.bank,
        accountNumber: body.accountNumber ?? existing.accountNumber,
        mfo: body.mfo ?? existing.mfo,
        director: body.director ?? existing.director,
        contactPerson: body.contactPerson ?? existing.contactPerson,
        branchId: body.branchId ?? existing.branchId,
        status: body.status ?? existing.status,
        ofdStatus: body.ofdStatus ?? existing.ofdStatus,
        debt: body.debt !== undefined ? Number(body.debt) : existing.debt,
      },
    });

    // Write audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          userName: user.name,
          action: 'UPDATE',
          entity: 'Customer',
          entityId: updated.id,
          oldValue: JSON.stringify({ companyName: existing.companyName, debt: existing.debt, status: existing.status }),
          newValue: JSON.stringify({ companyName: updated.companyName, debt: updated.debt, status: updated.status }),
        },
      });
    } catch (auditErr) {
      console.warn('Audit error:', auditErr);
    }

    return NextResponse.json({ success: true, customer: updated });
  } catch (error) {
    console.error('Customer PUT error:', error);
    return NextResponse.json({ error: 'Mijozni yangilashda xatolik yuz berdi' }, { status: 500 });
  }
}

// DELETE /api/customers/[id]: Soft-delete customer
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Mijozni o\'chirish uchun faqat Administrator huquqiga ega' }, { status: 403 });
    }

    const { id } = params;

    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      return NextResponse.json({ error: 'Mijoz topilmadi' }, { status: 404 });
    }

    // Soft delete
    await prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          userName: user.name,
          action: 'DELETE',
          entity: 'Customer',
          entityId: id,
          oldValue: `O'chirilgan mijoz: ${existing.companyName} (STIR: ${existing.inn})`,
        },
      });
    } catch (auditErr) {
      console.warn('Audit error:', auditErr);
    }

    return NextResponse.json({ success: true, message: 'Mijoz muvaffaqiyatli arxivlandi (soft-delete)' });
  } catch (error) {
    console.error('Customer DELETE error:', error);
    return NextResponse.json({ error: 'Mijozni o\'chirishda xatolik yuz berdi' }, { status: 500 });
  }
}
