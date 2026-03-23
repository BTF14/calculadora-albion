import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    const hasActiveSubscription = token?.subscriptionExpiresAt
      ? new Date(token.subscriptionExpiresAt as string) > new Date()
      : false;

    if (path.startsWith('/calculadora') && !hasActiveSubscription) {
      return NextResponse.redirect(new URL('/pago', req.url));
    }

    if (path.startsWith('/admin') && token?.isAdmin !== true) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: { authorized: ({ token }) => !!token },
  }
);

export const config = {
  matcher: ['/calculadora/:path*', '/admin/:path*', '/pago'],
};
