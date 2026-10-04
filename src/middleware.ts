import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';

const AUTH_COOKIE_NAME = 'onkm_session_token';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1';

  // 1. RATE LIMITING FOR SENSITIVE ENDPOINTS
  if (pathname.startsWith('/api/auth/login')) {
    const rl = checkRateLimit(`login_${ip}`, 15, 60 * 1000); // 15 attempts per minute max
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Haddan tashqari ko\'p urinish. Iltimos 1 daqiqadan so\'ng qayta urinib ko\'ring.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }
  } else if (pathname.startsWith('/api/')) {
    const rl = checkRateLimit(`api_${ip}`, 120, 60 * 1000); // 120 API requests per min
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'So\'rovlar soni me\'yordan oshdi (Rate limit exceeded).' },
        { status: 429 }
      );
    }
  }

  // 2. PUBLIC & STATIC PATHS
  const isAuthPath = pathname.startsWith('/login');
  const isPublicApi = pathname.startsWith('/api/auth') || pathname.startsWith('/api/telegram/webhook');
  const isStatic = pathname.startsWith('/_next') || pathname.startsWith('/favicon.ico');

  if (isStatic || isPublicApi) {
    const res = NextResponse.next();
    applySecurityHeaders(res);
    return res;
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  // 3. AUTHENTICATION REDIRECTS
  if (!token && !isAuthPath) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', encodeURIComponent(pathname));
    const res = NextResponse.redirect(url);
    applySecurityHeaders(res);
    return res;
  }

  if (token && isAuthPath) {
    const res = NextResponse.redirect(new URL('/dashboard', request.url));
    applySecurityHeaders(res);
    return res;
  }

  const response = NextResponse.next();
  applySecurityHeaders(response);
  return response;
}

function applySecurityHeaders(response: NextResponse) {
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
