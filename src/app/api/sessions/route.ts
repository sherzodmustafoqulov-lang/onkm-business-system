import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { checkPermission } from '@/lib/rbac';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canViewHR = checkPermission(user.role, user.permissions, 'HR', 'canView');
    const canViewUsers = checkPermission(user.role, user.permissions, 'USERS', 'canView');
    const isAdmin = user.role === 'ADMIN';

    if (!isAdmin && !canViewHR && !canViewUsers) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || ''; // 'ACTIVE', 'LOGGED_OUT'

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
        { ipAddress: { contains: search } },
        { deviceInfo: { contains: search } },
      ];
    }

    const sessions = await prisma.userSession.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            role: { select: { name: true, displayName: true } },
            branch: { select: { name: true } },
          },
        },
      },
      orderBy: { loginAt: 'desc' },
      take: 100,
    });

    const now = new Date();

    // Map sessions and compute real-time duration
    const processedSessions = sessions.map((s) => {
      let durationMinutes = s.durationMin || 0;
      let isLive = s.status === 'ACTIVE';

      // If active, compute minutes since login
      if (s.status === 'ACTIVE') {
        const diffMs = now.getTime() - new Date(s.loginAt).getTime();
        durationMinutes = Math.max(1, Math.round(diffMs / 60000));

        // If inactive for > 12 hours, mark as auto-expired
        const lastActiveDiff = now.getTime() - new Date(s.lastActiveAt).getTime();
        if (lastActiveDiff > 12 * 60 * 60 * 1000) {
          isLive = false;
        }
      }

      return {
        ...s,
        durationMinutes,
        isLive,
      };
    });

    // Compute stats
    const activeNowCount = processedSessions.filter((s) => s.isLive).length;
    const uniqueIps = new Set(processedSessions.map((s) => s.ipAddress).filter(Boolean));
    const totalMinutes = processedSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
    const avgDurationMin = processedSessions.length > 0 
      ? Math.round(totalMinutes / processedSessions.length) 
      : 0;

    return NextResponse.json({
      sessions: processedSessions,
      stats: {
        total: processedSessions.length,
        activeNow: activeNowCount,
        uniqueIpsCount: uniqueIps.size,
        avgDurationMin,
      },
    });
  } catch (error) {
    console.error('GET /api/sessions error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
