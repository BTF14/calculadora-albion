// lib/ratelimit.ts — Rate Limiters por endpoint (MVP v4.0)
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

// Registro / Auth — muy restrictivo (5 intentos / 10 min)
export const authRatelimit = new Ratelimit({
  redis,
  limiter:   Ratelimit.slidingWindow(5, '10 m'),
  analytics: true,
  prefix:    'rl:auth',
});

// Cupones — evitar brute-force de códigos (10 / min)
export const couponRatelimit = new Ratelimit({
  redis,
  limiter:   Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
  prefix:    'rl:coupon',
});

// Pagos — 5 envíos / hora por IP
export const paymentRatelimit = new Ratelimit({
  redis,
  limiter:   Ratelimit.slidingWindow(5, '1 h'),
  analytics: true,
  prefix:    'rl:payment',
});

// General API — 60 req / min
export const generalRatelimit = new Ratelimit({
  redis,
  limiter:   Ratelimit.slidingWindow(60, '1 m'),
  analytics: true,
  prefix:    'rl:general',
});

// Helper: obtener IP del request de forma segura
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() ?? 'unknown';
  return req.headers.get('x-real-ip') ?? 'unknown';
}

// Helper: respuesta estándar de rate limit
export function rateLimitResponse(): Response {
  return new Response(
    JSON.stringify({ error: 'Demasiadas solicitudes. Espera un momento e intenta de nuevo.' }),
    {
      status:  429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': '60' },
    }
  );
}
