import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { checkPermission } from '@/lib/rbac';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const roles = await prisma.role.findMany({
      include: {
        _count: {
          select: { users: true }
        },
        permissions: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(roles);
  } catch (error: any) {
    console.error('GET /api/roles error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') { // Faqat Admin rol yarata oladi
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, displayName, description, permissions } = body;

    if (!name || !displayName) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    const existingRole = await prisma.role.findUnique({ where: { name } });
    if (existingRole) {
      return NextResponse.json({ error: 'Role already exists' }, { status: 400 });
    }

    const newRole = await prisma.role.create({
      data: {
        name,
        displayName,
        description,
        permissions: {
          create: permissions || []
        }
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: 'CREATE',
        entity: 'Role',
        entityId: newRole.id,
        newValue: JSON.stringify({ name: newRole.name })
      }
    });

    return NextResponse.json(newRole, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/roles error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
