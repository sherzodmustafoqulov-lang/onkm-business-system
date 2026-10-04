import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Faqat Admin uchun ruxsat etilgan' }, { status: 403 });
    }

    const sessionId = params.id;
    const session = await prisma.userSession.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });

    if (!session) {
      return NextResponse.json({ error: 'Sessiya topilmadi' }, { status: 404 });
    }

    const now = new Date();
    const durationMin = Math.max(
      1,
      Math.round((now.getTime() - session.loginAt.getTime()) / 60000)
    );

    await prisma.userSession.update({
      where: { id: sessionId },
      data: {
        status: 'LOGGED_OUT',
        logoutAt: now,
        durationMin,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        userName: currentUser.name,
        action: 'UPDATE',
        entity: 'UserSession',
        entityId: sessionId,
        newValue: `Admin tomonidan majburiy sessiya yakunlandi: ${session.user.name}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Sessiya muvaffaqiyatli to\'xtatildi',
    });
  } catch (error) {
    console.error('Session terminate error:', error);
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}
