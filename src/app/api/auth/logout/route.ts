import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { AUTH_COOKIE_NAME, SESSION_COOKIE_NAME, getCurrentUser } from '@/lib/auth';

export async function POST() {
  try {
    const user = await getCurrentUser();
    const cookieStore = cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (sessionId) {
      const session = await prisma.userSession.findUnique({
        where: { id: sessionId },
      });

      if (session && session.status === 'ACTIVE') {
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
            lastActiveAt: now,
            durationMin,
          },
        });
      }
    } else if (user) {
      // Find latest active session for this user
      const latestSession = await prisma.userSession.findFirst({
        where: { userId: user.id, status: 'ACTIVE' },
        orderBy: { loginAt: 'desc' },
      });

      if (latestSession) {
        const now = new Date();
        const durationMin = Math.max(
          1,
          Math.round((now.getTime() - latestSession.loginAt.getTime()) / 60000)
        );
        await prisma.userSession.update({
          where: { id: latestSession.id },
          data: {
            status: 'LOGGED_OUT',
            logoutAt: now,
            lastActiveAt: now,
            durationMin,
          },
        });
      }
    }

    if (user) {
      try {
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            userName: user.name,
            action: 'LOGOUT',
            entity: 'Auth',
            entityId: user.id,
            newValue: `Tizimdan chiqish: ${user.name}`,
          },
        });
      } catch (err) {
        console.warn('Audit logout log error:', err);
      }
    }

    const response = NextResponse.json({
      success: true,
      message: 'Tizimdan muvaffaqiyatli chiqildi',
    });

    response.cookies.delete(AUTH_COOKIE_NAME);
    response.cookies.delete(SESSION_COOKIE_NAME);

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    const response = NextResponse.json({
      success: true,
      message: 'Tizimdan chiqildi',
    });
    response.cookies.delete(AUTH_COOKIE_NAME);
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }
}
