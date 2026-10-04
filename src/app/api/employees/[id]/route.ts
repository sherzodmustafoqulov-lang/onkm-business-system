import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { checkPermission } from '@/lib/rbac';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const canViewHR = checkPermission(user.role, user.permissions, 'HR', 'canView');
    const canViewUsers = checkPermission(user.role, user.permissions, 'USERS', 'canView');

    // Foydalanuvchi faqat o'zini yoki HR/Users permissioni bo'lsa boshqalarni ko'ra oladi
    if (!canViewHR && !canViewUsers && user.id !== params.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const employee = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        role: true,
        branch: true,
        department: true,
        position: true,
        employeeProfile: {
          include: {
            salary: true,
            kpiResults: {
              orderBy: { periodEnd: 'desc' }
            },
            documents: true,
            activities: {
              orderBy: { createdAt: 'desc' },
              take: 50
            },
            statusHistory: {
              orderBy: { createdAt: 'desc' }
            },
            manager: {
              select: { name: true }
            }
          }
        }
      }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Maxfiy ma'lumotlarni tozalash
    const canViewFinance = checkPermission(user.role, user.permissions, 'HR', 'canFinanceView');
    const { passwordHash, ...safeEmployee } = employee;

    if (!canViewFinance && safeEmployee.employeeProfile?.salary) {
      if (safeEmployee.id !== user.id) { // O'z ish haqini ko'ra oladi
        safeEmployee.employeeProfile.salary = null as any;
      }
    }

    return NextResponse.json(safeEmployee);
  } catch (error: any) {
    console.error('GET /api/employees/[id] error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user || !checkPermission(user.role, user.permissions, 'HR', 'canEdit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      firstName, lastName, middleName, phone, extraPhone, email,
      telegram, birthDate, gender, address,
      branchId, roleId, departmentId, positionId, managerId,
      workType, employmentStatus, hireDate, notes,
      baseSalary, currency, rate, isActive, avatar
    } = body;

    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
      include: { employeeProfile: true }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const fullName = lastName && firstName ? `${lastName} ${firstName} ${middleName || ''}`.trim() : existingUser.name;

    const updateData: any = {
      name: fullName,
      phone,
      branchId: branchId || null,
      departmentId: departmentId || null,
      positionId: positionId || null,
    };

    if (email) updateData.email = email;
    if (roleId) updateData.roleId = roleId;
    if (typeof isActive !== 'undefined') updateData.isActive = isActive;
    if (avatar !== undefined) updateData.avatar = avatar;

    const updatedEmployee = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...updateData,
        employeeProfile: {
          upsert: {
            create: {
              firstName, lastName, middleName, gender, extraPhone, telegram, address,
              birthDate: birthDate ? new Date(birthDate) : null,
              hireDate: hireDate ? new Date(hireDate) : null,
              workType, employmentStatus, notes,
              managerId: managerId || null,
              salary: baseSalary ? {
                create: {
                  baseSalary: parseFloat(baseSalary),
                  currency: currency || 'UZS',
                  rate: parseFloat(rate || 1)
                }
              } : undefined
            },
            update: {
              firstName, lastName, middleName, gender, extraPhone, telegram, address,
              birthDate: birthDate ? new Date(birthDate) : null,
              hireDate: hireDate ? new Date(hireDate) : null,
              workType, employmentStatus, notes,
              managerId: managerId || null,
            }
          }
        }
      },
      include: { employeeProfile: true }
    });

    // Update salary separately if it exists and user has finance permission
    const canViewFinance = checkPermission(user.role, user.permissions, 'HR', 'canFinanceView');
    if (baseSalary && canViewFinance && existingUser.employeeProfile) {
      await prisma.employeeSalary.upsert({
        where: { employeeProfileId: existingUser.employeeProfile.id },
        create: {
          employeeProfileId: existingUser.employeeProfile.id,
          baseSalary: parseFloat(baseSalary),
          currency: currency || 'UZS',
          rate: parseFloat(rate || 1)
        },
        update: {
          baseSalary: parseFloat(baseSalary),
          currency: currency || 'UZS',
          rate: parseFloat(rate || 1)
        }
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: 'UPDATE',
        entity: 'Employee',
        entityId: params.id,
        newValue: JSON.stringify({ roleId, employmentStatus, isActive })
      }
    });

    return NextResponse.json(updatedEmployee);
  } catch (error: any) {
    console.error('PUT /api/employees/[id] error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
