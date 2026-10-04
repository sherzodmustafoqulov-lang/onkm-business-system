import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  verifyPassword,
  signToken,
  AUTH_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  parseUserAgent,
  getClientIp,
} from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email (login) va parol kiritilishi shart' },
        { status: 400 }
      );
    }

    // Clean login / email
    const cleanLogin = email.toLowerCase().trim();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanLogin },
          { email: cleanLogin.includes('@') ? cleanLogin : `${cleanLogin}@onkm.uz` },
        ],
      },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
        branch: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Login yoki parol noto\'g\'ri' },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Login yoki parol noto\'g\'ri' },
        { status: 401 }
      );
    }

    // Sign JWT Token
    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role.name,
      branchId: user.branchId,
    });

    // Extract Client Network & Device info
    const ipAddress = getClientIp(request);
    const userAgent = request.headers.get('user-agent') || '';
    const deviceInfo = parseUserAgent(userAgent);

    // Create UserSession in database
    let session = null;
    try {
      session = await prisma.userSession.create({
        data: {
          userId: user.id,
          token: token.substring(0, 40), // partial token reference
          ipAddress,
          userAgent,
          deviceInfo,
          loginAt: new Date(),
          lastActiveAt: new Date(),
          status: 'ACTIVE',
        },
      });
    } catch (sessionErr) {
      console.warn('UserSession create error:', sessionErr);
    }

    // Record audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          userName: user.name,
          action: 'LOGIN',
          entity: 'Auth',
          entityId: user.id,
          newValue: `Muvaffaqiyatli kirish: ${user.name} (${user.role.displayName}) • IP: ${ipAddress} • Qurilma: ${deviceInfo}`,
          ipAddress,
          userAgent,
        },
      });
    } catch (auditErr) {
      console.warn('Audit log write error:', auditErr);
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        roleDisplayName: user.role.displayName,
        branchId: user.branchId,
        branchName: user.branch?.name,
        mustChangePassword: user.mustChangePassword,
      },
      sessionId: session?.id,
    });

    // Set secure auth cookie
    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Set session cookie for session duration tracking
    if (session?.id) {
      response.cookies.set(SESSION_COOKIE_NAME, session.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Tizimda xatolik yuz berdi' },
      { status: 500 }
    );
  }
}
