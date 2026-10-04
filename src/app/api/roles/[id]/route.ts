import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    // Only Admin can edit roles
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { displayName, description, permissions } = body;

    const existingRole = await prisma.role.findUnique({
      where: { id: params.id },
      include: { permissions: true }
    });

    if (!existingRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    if (existingRole.isSystem && existingRole.name === 'ADMIN') {
      // Prevent removing self-admin privileges by accident, though we can allow some changes
      // In a real app, maybe lock down ADMIN role entirely
    }

    // Delete existing permissions and recreate them
    await prisma.permission.deleteMany({
      where: { roleId: params.id }
    });

    const updatedRole = await prisma.role.update({
      where: { id: params.id },
      data: {
        displayName: displayName || existingRole.displayName,
        description: description !== undefined ? description : existingRole.description,
        permissions: {
          create: permissions || []
        }
      },
      include: {
        permissions: true
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: 'UPDATE',
        entity: 'Role',
        entityId: updatedRole.id,
        newValue: JSON.stringify({ displayName, updatedPermissionsCount: permissions?.length })
      }
    });

    return NextResponse.json(updatedRole);
  } catch (error: any) {
    console.error('PUT /api/roles/[id] error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
