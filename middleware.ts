import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('session')?.value;
  const { valid } = token ? await verifySession(token) : { valid: false };

  const protectedPaths = ['/app', '/api/signals', '/api/subscriptions'];
  const isProtected = protectedPaths.some(p => req.nextUrl.pathname.startsWith(p));

  if (isProtected && !valid) {
    return NextResponse.redirect(new URL('/', req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*', '/api/:path*'],
};