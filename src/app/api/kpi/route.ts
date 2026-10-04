import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { checkPermission } from '@/lib/rbac';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const canViewKPI = checkPermission(user.role, user.permissions, 'KPI', 'canView');
    if (!canViewKPI) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const kpis = await prisma.kPI.findMany({
      include: {
        metrics: true,
        role: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(kpis);
  } catch (error: any) {
    console.error('GET /api/kpi error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !checkPermission(user.role, user.permissions, 'KPI', 'canCreate')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, roleId, type, period, description, metrics } = body;

    if (!name || !type || !period) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    const newKPI = await prisma.kPI.create({
      data: {
        name,
        roleId: roleId || null,
        type,
        period,
        description,
        metrics: {
          create: metrics || []
        }
      },
      include: {
        metrics: true
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: 'CREATE',
        entity: 'KPI',
        entityId: newKPI.id,
        newValue: JSON.stringify({ name: newKPI.name })
      }
    });

    return NextResponse.json(newKPI, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/kpi error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
