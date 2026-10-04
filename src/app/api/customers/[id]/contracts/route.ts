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
      contractNumber,
      contractType,
      startDate,
      endDate,
      amount,
      status = 'FAOL',
      fileUrl,
      notes,
    } = body;

    if (!contractNumber || !contractType) {
      return NextResponse.json(
        { error: 'Shartnoma raqami va xizmat turi kiritilishi shart' },
        { status: 400 }
      );
    }

    const existing = await prisma.customerContract.findUnique({
      where: { contractNumber },
    });

    if (existing) {
      return NextResponse.json(
        { error: `"${contractNumber}" raqamli shartnoma allaqachon mavjud` },
        { status: 400 }
      );
    }

    const newContract = await prisma.customerContract.create({
      data: {
        customerId,
        contractNumber: contractNumber.trim(),
        contractType: contractType.trim(),
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        amount: parseFloat(amount) || 0,
        status: status || 'FAOL',
        fileUrl: fileUrl || null,
        notes: notes ? notes.trim() : null,
      },
    });

    // Write audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          userName: user.name,
          action: 'CREATE_CONTRACT',
          entity: 'Customer',
          entityId: customerId,
          newValue: `Yangi shartnoma: ${newContract.contractNumber} (${newContract.contractType})`,
        },
      });
    } catch (e) {}

    return NextResponse.json({
      success: true,
      contract: newContract,
      message: 'Shartnoma muvaffaqiyatli saqlandi',
    });
  } catch (error: any) {
    console.error('Create contract error:', error);
    return NextResponse.json(
      { error: error.message || 'Shartnomani saqlashda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}
