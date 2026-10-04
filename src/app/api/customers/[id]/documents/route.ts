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
      title,
      docType = 'SHARTNOMA', // SHARTNOMA, GUVOHNOMA, IJARA, KADASTR, AKT, BOSHQA
      fileNumber,
      fileSize,
      fileUrl,
      issuedDate,
    } = body;

    if (!title?.trim() || !docType) {
      return NextResponse.json(
        { error: 'Hujjat nomi va turi kiritilishi shart' },
        { status: 400 }
      );
    }

    const newDoc = await prisma.customerDocument.create({
      data: {
        customerId,
        title: title.trim(),
        docType: docType.trim(),
        fileNumber: fileNumber ? fileNumber.trim() : null,
        fileSize: fileSize || null,
        fileUrl: fileUrl || null,
        issuedDate: issuedDate ? new Date(issuedDate) : new Date(),
      },
    });

    // Write audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          userName: user.name,
          action: 'UPLOAD_DOCUMENT',
          entity: 'Customer',
          entityId: customerId,
          newValue: `Hujjat yuklandi: ${newDoc.title} (${newDoc.docType}, ${newDoc.fileSize || 'PDF'})`,
        },
      });
    } catch (e) {}

    return NextResponse.json({
      success: true,
      document: newDoc,
      message: 'Hujjat muvaffaqiyatli saqlandi',
    });
  } catch (error: any) {
    console.error('Create document error:', error);
    return NextResponse.json(
      { error: error.message || 'Hujjatni saqlashda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}
