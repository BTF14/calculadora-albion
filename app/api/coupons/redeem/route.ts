// app/api/coupons/redeem/route.ts
// Fix #3: UPDATE atómico con WHERE is_redeemed = false — elimina race condition
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { RedeemCouponSchema } from '@/lib/validations';
import { couponRatelimit, getClientIp, rateLimitResponse } from '@/lib/ratelimit';

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const { success: rlOk } = await couponRatelimit.limit(ip);
    if (!rlOk) return rateLimitResponse();

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
    }

    const userId = Number(session.user.id);
    const body   = await req.json();

    const parsed = RedeemCouponSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Código inválido' },
        { status: 400 }
      );
    }

    const { code } = parsed.data;

    // Fix #3: UPDATE atómico que solo tiene efecto si el cupón está disponible.
    // Si dos requests llegan simultáneamente, solo uno obtendrá una fila en RETURNING.
    const claimed = await query<{
      id: number;
      reward_days: number;
    }>(
      `UPDATE coupons
       SET is_redeemed = true, redeemed_by = $1
       WHERE code = $2
         AND is_redeemed = false
         AND expires_at > NOW()
       RETURNING id, reward_days`,
      [userId, code]
    );

    // Si no se actualizó ninguna fila: código inválido, ya canjeado, o expirado
    if (claimed.length === 0) {
      // Diagnosticar para dar mensaje preciso
      const coupon = await query<{ is_redeemed: boolean; expires_at: string }>(
        'SELECT is_redeemed, expires_at FROM coupons WHERE code = $1',
        [code]
      );

      if (!coupon[0]) {
        return NextResponse.json({ error: 'Código no encontrado.' }, { status: 404 });
      }
      if (coupon[0].is_redeemed) {
        return NextResponse.json({ error: 'Este cupón ya fue canjeado.' }, { status: 409 });
      }
      if (new Date(coupon[0].expires_at) < new Date()) {
        return NextResponse.json({ error: 'Este cupón ha expirado.' }, { status: 410 });
      }
      return NextResponse.json({ error: 'No se pudo canjear el cupón.' }, { status: 400 });
    }

    const { reward_days } = claimed[0];

    // Extender suscripción
    const currentSub = await query<{ expiry_date: string }>(
      `SELECT expiry_date FROM subscriptions
       WHERE user_id = $1 ORDER BY expiry_date DESC LIMIT 1`,
      [userId]
    );

    const baseExpiry    = currentSub[0]?.expiry_date ? new Date(currentSub[0].expiry_date) : new Date();
    const effectiveBase = baseExpiry > new Date() ? baseExpiry : new Date();
    const newExpiry     = new Date(effectiveBase.getTime() + reward_days * 86400 * 1000);

    await query(
      `INSERT INTO subscriptions (user_id, expiry_date, plan) VALUES ($1, $2, 'trial')`,
      [userId, newExpiry]
    );

    return NextResponse.json({
      success:    true,
      reward_days,
      new_expiry: newExpiry.toISOString(),
      message:    `¡Cupón aplicado! Ganaste ${reward_days} días de acceso.`,
    });
  } catch (error) {
    console.error('[COUPON_REDEEM_ERROR]', error);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
