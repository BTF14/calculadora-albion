// app/api/cron/expiry-check/route.ts
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  sendSubscriptionExpiringEmail,
} from '@/lib/email';

// ─── TIPOS ────────────────────────────────────────────────────
// Se agregó [key: string]: any para cumplir con la restricción de Record<string, unknown>
interface ExpiringUser {
  [key: string]: any; 
  user_id:       number;
  email:         string;
  referral_code: string;
  effective_expiry: string;
}

// ─── HELPERS ──────────────────────────────────────────────────
function verifyCronSecret(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.warn('[CRON] CRON_SECRET no configurado — endpoint desprotegido');
    return true; 
  }
  const auth = req.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

// ─── HANDLER ──────────────────────────────────────────────────
export async function GET(req: Request) {
  const startTime = Date.now();

  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  if (process.env.NODE_ENV === 'production' && !process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: 'CRON_SECRET no configurado en producción.' },
      { status: 500 }
    );
  }

  const results = {
    expiring_3d_found:  0,
    expiring_3d_sent:   0,
    expiring_3d_errors: 0,
    expired_found:      0,
    expired_sent:       0,
    expired_errors:     0,
    skipped_no_email:   0,
    duration_ms:        0,
  };

  try {
    // CASO 1: Vencen en 3 días
    const expiringSoon = await query<ExpiringUser>(`
      SELECT
        u.id          AS user_id,
        u.email,
        u.referral_code,
        get_user_expiry(u.id)::text AS effective_expiry
      FROM users u
      WHERE
        u.email IS NOT NULL
        AND get_user_expiry(u.id) > NOW() + INTERVAL '2 days'
        AND get_user_expiry(u.id) < NOW() + INTERVAL '4 days'
    `);

    results.expiring_3d_found = expiringSoon.length;

    for (const user of expiringSoon) {
      if (!user.email) { results.skipped_no_email++; continue; }
      try {
        await sendSubscriptionExpiringEmail({
          userEmail:    user.email,
          expiryDate:   new Date(user.effective_expiry),
          referralCode: user.referral_code,
        });
        results.expiring_3d_sent++;
      } catch (err) {
        results.expiring_3d_errors++;
      }
    }

    // CASO 2: Vencieron hoy
    const expiredToday = await query<ExpiringUser>(`
      SELECT
        u.id          AS user_id,
        u.email,
        u.referral_code,
        get_user_expiry(u.id)::text AS effective_expiry
      FROM users u
      WHERE
        u.email IS NOT NULL
        AND get_user_expiry(u.id) < NOW()
        AND get_user_expiry(u.id) > NOW() - INTERVAL '26 hours'
    `);

    results.expired_found = expiredToday.length;

    for (const user of expiredToday) {
      if (!user.email) { results.skipped_no_email++; continue; }
      try {
        await sendSubscriptionExpiringEmail({
          userEmail:    user.email,
          expiryDate:   new Date(user.effective_expiry),
          referralCode: user.referral_code,
        });
        results.expired_sent++;
      } catch (err) {
        results.expired_errors++;
      }
    }

    results.duration_ms = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });

  } catch (error) {
    console.error('[CRON] Error fatal:', error);
    return NextResponse.json(
      {
        success:  false,
        error:    'Error interno del cron job.',
        duration: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
