import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { checkPermission } from '@/lib/rbac';
import { hashPassword } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const canViewHR = checkPermission(user.role, user.permissions, 'HR', 'canView');
    const canViewUsers = checkPermission(user.role, user.permissions, 'USERS', 'canView');

    if (!canViewHR && !canViewUsers) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const branchId = searchParams.get('branchId') || '';
    const roleId = searchParams.get('roleId') || '';
    const departmentId = searchParams.get('departmentId') || '';

    const whereCondition: any = {};

    if (search) {
      whereCondition.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { employeeProfile: { employeeId: { contains: search } } }
      ];
    }

    if (branchId) whereCondition.branchId = branchId;
    if (roleId) whereCondition.roleId = roleId;
    if (departmentId) whereCondition.departmentId = departmentId;

    const employees = await prisma.user.findMany({
      where: whereCondition,
      include: {
        role: true,
        branch: true,
        department: true,
        position: true,
        employeeProfile: {
          include: {
            salary: true,
            kpiResults: {
              take: 1,
              orderBy: { periodEnd: 'desc' }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const canViewFinance = checkPermission(user.role, user.permissions, 'HR', 'canFinanceView');

    const safeEmployees = employees.map(emp => {
      const { passwordHash, ...safeEmp } = emp;

      if (!canViewFinance && safeEmp.employeeProfile?.salary) {
        if (safeEmp.id !== user.id) {
          safeEmp.employeeProfile.salary = null as any;
        }
      }
      return safeEmp;
    });

    return NextResponse.json(safeEmployees);
  } catch (error: any) {
    console.error('GET /api/employees error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !checkPermission(user.role, user.permissions, 'HR', 'canCreate')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      firstName, lastName, middleName, phone, extraPhone, email,
      telegram, birthDate, gender, address,
      branchId, roleId, departmentId, positionId, managerId,
      workType, employmentStatus, hireDate, notes,
      login, password,
      baseSalary, currency, rate, avatar
    } = body;

    if (!firstName || !lastName || !email || !roleId || !password) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const fullName = `${lastName} ${firstName} ${middleName || ''}`.trim();
    const employeeId = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;

    const newEmployee = await prisma.user.create({
      data: {
        name: fullName,
        email,
        phone,
        passwordHash: hashedPassword,
        avatar,
        roleId,
        branchId: branchId || null,
        departmentId: departmentId || null,
        positionId: positionId || null,
        employeeProfile: {
          create: {
            employeeId,
            firstName,
            lastName,
            middleName,
            birthDate: birthDate ? new Date(birthDate) : null,
            gender,
            extraPhone,
            telegram,
            address,
            hireDate: hireDate ? new Date(hireDate) : null,
            workType,
            employmentStatus: employmentStatus || 'FAOL',
            managerId: managerId || null,
            notes,
            salary: baseSalary ? {
              create: {
                baseSalary: parseFloat(baseSalary),
                currency: currency || 'UZS',
                rate: parseFloat(rate || 1)
              }
            } : undefined
          }
        }
      },
      include: {
        employeeProfile: true
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: 'CREATE',
        entity: 'Employee',
        entityId: newEmployee.id,
        newValue: JSON.stringify({ email: newEmployee.email, roleId })
      }
    });

    return NextResponse.json(newEmployee, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/employees error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
