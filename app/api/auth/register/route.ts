// app/api/auth/register/route.ts
// Fix #2: usa transacción SQL — usuario + trial en una sola operación atómica
import { NextResponse } from 'next/server';
import { hash } from 'bcrypt';
import { db, query } from '@/lib/db';
import { RegisterSchema } from '@/lib/validations';
import { generateUniqueReferralCode } from '@/lib/referral';
import { authRatelimit, getClientIp, rateLimitResponse } from '@/lib/ratelimit';

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const { success } = await authRatelimit.limit(ip);
    if (!success) return rateLimitResponse();

    const body   = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      );
    }

    const { email, password, referral_code: referredByCode } = parsed.data;

    const existing = await query<{ id: number }>(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Este email ya está registrado.' }, { status: 409 });
    }

    let referredById: number | null = null;
    if (referredByCode) {
      const referrer = await query<{ id: number }>(
        'SELECT id FROM users WHERE referral_code = $1',
        [referredByCode]
      );
      if (referrer[0]) referredById = referrer[0].id;
    }

    const passwordHash    = await hash(password, 10);
    const newReferralCode = await generateUniqueReferralCode();
    const trialExpiry     = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Fix #2: transacción atómica — si el INSERT de subscriptions falla,
    // el usuario NO se crea y no quedan registros huérfanos
    await db`BEGIN`;
    try {
      const newUser = await query<{ id: number }>(
        `INSERT INTO users (email, password_hash, referral_code, referred_by, role)
         VALUES ($1, $2, $3, $4, 'guest')
         RETURNING id`,
        [email, passwordHash, newReferralCode, referredById]
      );

      await query(
        `INSERT INTO subscriptions (user_id, expiry_date, free_trial_used, plan)
         VALUES ($1, $2, true, 'trial')`,
        [newUser[0].id, trialExpiry]
      );

      await db`COMMIT`;

      return NextResponse.json({
        success:       true,
        referral_code: newReferralCode,
        message:       '¡Registro exitoso! Tienes 24h de prueba gratuita.',
      });
    } catch (txErr) {
      await db`ROLLBACK`;
      throw txErr;
    }
  } catch (error) {
    console.error('[REGISTER_ERROR]', error);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
