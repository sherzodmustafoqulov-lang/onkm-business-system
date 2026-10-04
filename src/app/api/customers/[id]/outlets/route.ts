import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
    }

    const customerId = params.id;
    const body = await request.json();

    const {
      name,
      address,
      phone,
      landmark,
      status = 'FAOL',
    } = body;

    if (!name?.trim() || !address?.trim()) {
      return NextResponse.json(
        { error: 'Savdo nuqtasi nomi va manzili kiritilishi shart' },
        { status: 400 }
      );
    }

    const newOutlet = await prisma.customerOutlet.create({
      data: {
        customerId,
        name: name.trim(),
        address: address.trim(),
        phone: phone ? phone.trim() : null,
        landmark: landmark ? landmark.trim() : null,
        status: status || 'FAOL',
        openedAt: new Date(),
      },
    });

    // Write audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          userName: user.name,
          action: 'CREATE_OUTLET',
          entity: 'Customer',
          entityId: customerId,
          newValue: `Yangi savdo nuqtasi: ${newOutlet.name} (${newOutlet.address})`,
        },
      });
    } catch (e) {}

    return NextResponse.json({
      success: true,
      outlet: newOutlet,
      message: 'Savdo nuqtasi muvaffaqiyatli yaratildi',
    });
  } catch (error: any) {
    console.error('Create outlet error:', error);
    return NextResponse.json(
      { error: error.message || 'Savdo nuqtasini yaratishda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}

// PUT: Update an existing customer outlet
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
    }

    const customerId = params.id;
    const body = await request.json();

    const {
      id,
      name,
      address,
      phone,
      landmark,
      status = 'FAOL',
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Savdo nuqtasi IDsi ko\'rsatilmadi' }, { status: 400 });
    }

    if (!name?.trim() || !address?.trim()) {
      return NextResponse.json(
        { error: 'Savdo nuqtasi nomi va manzili kiritilishi shart' },
        { status: 400 }
      );
    }

    const updatedOutlet = await prisma.customerOutlet.update({
      where: { id },
      data: {
        name: name.trim(),
        address: address.trim(),
        phone: phone ? phone.trim() : null,
        landmark: landmark ? landmark.trim() : null,
        status: status || 'FAOL',
      },
    });

    // Write audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          userName: user.name,
          action: 'UPDATE_OUTLET',
          entity: 'Customer',
          entityId: customerId,
          newValue: `Savdo nuqtasi tahrirlandi: ${updatedOutlet.name} (${updatedOutlet.address})`,
        },
      });
    } catch (e) {}

    return NextResponse.json({
      success: true,
      outlet: updatedOutlet,
      message: 'Savdo nuqtasi muvaffaqiyatli yangilandi',
    });
  } catch (error: any) {
    console.error('Update outlet error:', error);
    return NextResponse.json(
      { error: error.message || 'Savdo nuqtasini yangilashda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a customer outlet
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
    }

    const customerId = params.id;
    const { searchParams } = new URL(request.url);
    const outletId = searchParams.get('outletId');

    if (!outletId) {
      return NextResponse.json({ error: 'Savdo nuqtasi IDsi ko\'rsatilmadi' }, { status: 400 });
    }

    await prisma.customerOutlet.delete({
      where: { id: outletId },
    });

    // Write audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          userName: user.name,
          action: 'DELETE_OUTLET',
          entity: 'Customer',
          entityId: customerId,
          newValue: `Savdo nuqtasi o'chirildi (ID: ${outletId})`,
        },
      });
    } catch (e) {}

    return NextResponse.json({
      success: true,
      message: 'Savdo nuqtasi muvaffaqiyatli o\'chirildi',
    });
  } catch (error: any) {
    console.error('Delete outlet error:', error);
    return NextResponse.json(
      { error: error.message || 'Savdo nuqtasini o\'chirishda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}

