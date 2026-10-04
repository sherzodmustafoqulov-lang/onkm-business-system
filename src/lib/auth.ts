import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import prisma from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'onkm-business-system-jwt-secret-key-32ch-enterprise';
export const AUTH_COOKIE_NAME = 'onkm_session_token';
export const SESSION_COOKIE_NAME = 'onkm_session_id';

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  branchId?: string | null;
}

export function parseUserAgent(ua?: string | null): string {
  if (!ua) return 'Noma\'lum qurilma';

  let os = 'Noma\'lum OS';
  if (ua.includes('Windows NT 10.0')) os = 'Windows 10/11';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Linux')) os = 'Linux';

  let browser = 'Brauzer';
  if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari';
  else if (ua.includes('Firefox/')) browser = 'Firefox';

  return `${os} • ${browser}`;
}

export function getClientIp(req: Request | any): string {
  if (!req) return '127.0.0.1';
  const headers = req.headers;
  const forwarded = typeof headers?.get === 'function' 
    ? headers.get('x-forwarded-for') 
    : headers?.['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = typeof headers?.get === 'function' 
    ? headers.get('x-real-ip') 
    : headers?.['x-real-ip'];
  if (realIp) return realIp.trim();
  return req.ip || '127.0.0.1';
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
        branch: true,
      },
    });

    if (!user || !user.isActive) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role.name,
      roleDisplayName: user.role.displayName,
      branchId: user.branchId,
      branchName: user.branch?.name,
      permissions: user.role.permissions,
      mustChangePassword: user.mustChangePassword,
    };
  } catch (error) {
    console.error('getCurrentUser error:', error);
    return null;
  }
}
