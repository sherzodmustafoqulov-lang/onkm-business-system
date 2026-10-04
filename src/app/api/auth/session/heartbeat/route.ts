import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { SESSION_COOKIE_NAME, getCurrentUser } from '@/lib/auth';

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cookieStore = cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    const now = new Date();

    if (sessionId) {
      const session = await prisma.userSession.findUnique({
        where: { id: sessionId },
      });

      if (session && session.status === 'ACTIVE') {
        const durationMin = Math.max(
          1,
          Math.round((now.getTime() - session.loginAt.getTime()) / 60000)
        );

        await prisma.userSession.update({
          where: { id: sessionId },
          data: {
            lastActiveAt: now,
            durationMin,
          },
        });

        return NextResponse.json({ success: true, durationMin });
      }
    }

    // Fallback: update latest active session for this user
    const activeSession = await prisma.userSession.findFirst({
      where: { userId: user.id, status: 'ACTIVE' },
      orderBy: { loginAt: 'desc' },
    });

    if (activeSession) {
      const durationMin = Math.max(
        1,
        Math.round((now.getTime() - activeSession.loginAt.getTime()) / 60000)
      );
      await prisma.userSession.update({
        where: { id: activeSession.id },
        data: {
          lastActiveAt: now,
          durationMin,
        },
      });
      return NextResponse.json({ success: true, durationMin });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Session heartbeat error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
