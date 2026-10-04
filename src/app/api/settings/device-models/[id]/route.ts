import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// PATCH /api/settings/device-models/[id]: Update device model or monthly fee
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'ting' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    const existing = await prisma.deviceModelConfig.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Qurilma modeli topilmadi' }, { status: 404 });
    }

    const updateData: any = {};

    if (body.modelName !== undefined) updateData.modelName = body.modelName.trim();
    if (body.deviceType !== undefined) updateData.deviceType = body.deviceType.trim();
    if (body.manufacturer !== undefined) updateData.manufacturer = body.manufacturer?.trim() || null;
    if (body.monthlyFee !== undefined) updateData.monthlyFee = parseFloat(body.monthlyFee) || 0;
    if (body.yearlyFee !== undefined) updateData.yearlyFee = body.yearlyFee ? parseFloat(body.yearlyFee) : null;
    if (body.billingCycle !== undefined) updateData.billingCycle = body.billingCycle;
    if (body.gracePeriodDays !== undefined) updateData.gracePeriodDays = parseInt(body.gracePeriodDays) || 5;
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);

    const updated = await prisma.deviceModelConfig.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      model: updated,
      message: 'Qurilma modeli va abonent to\'lovi muvaffaqiyatli yangilandi',
    });
  } catch (error: any) {
    console.error('Error updating device model:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Modelni yangilashda xatolik' },
      { status: 500 }
    );
  }
}

// DELETE /api/settings/device-models/[id]: Delete model
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Avtorizatsiyadan o\'ting' }, { status: 401 });
    }

    const { id } = params;

    await prisma.deviceModelConfig.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Qurilma modeli o\'chirildi',
    });
  } catch (error: any) {
    console.error('Error deleting device model:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Modelni o\'chirishda xatolik' },
      { status: 500 }
    );
  }
}
