// middleware.ts
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path  = req.nextUrl.pathname;

    const subscriptionExpiresAt = token?.subscriptionExpiresAt as string | null | undefined;
    const hasActiveSubscription = subscriptionExpiresAt
      ? new Date(subscriptionExpiresAt) > new Date()
      : false;

    // Calculadora: requiere suscripción activa
    if (path.startsWith('/calculadora') && !hasActiveSubscription) {
      return NextResponse.redirect(new URL('/pago', req.url));
    }

    // Admin: requiere role admin
    if (path.startsWith('/admin') && token?.isAdmin !== true) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Dashboard: requiere autenticación (ya garantizado por withAuth)
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    '/calculadora/:path*',
    '/admin/:path*',
    '/dashboard/:path*',
    '/pago',
  ],
};
