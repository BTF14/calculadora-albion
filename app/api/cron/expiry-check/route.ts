// app/api/cron/expiry-check/route.ts
//
// PROPÓSITO: Corre una vez al día vía Vercel Cron.
//   1. Detecta usuarios con suscripción que vence en exactamente 3 días → email de aviso
//   2. Detecta usuarios con suscripción que venció hoy                  → email de expiración
//   3. Logs detallados para saber qué pasó sin entrar a la BD
//
// SEGURIDAD: Requiere header Authorization: Bearer <CRON_SECRET>
// Vercel inyecta este header automáticamente cuando configuras el cron.

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  sendSubscriptionExpiringEmail,
} from '@/lib/email';

// ─── TIPOS ────────────────────────────────────────────────────
interface ExpiringUser {
  [key: string]: any; // Permite compatibilidad con Record<string, unknown>
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
    return true; // Permite en dev si no hay secret, bloquea en prod abajo
  }
  const auth = req.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

// ─── HANDLER ──────────────────────────────────────────────────
export async function GET(req: Request) {
  const startTime = Date.now();

  // Seguridad: solo Vercel Cron (o llamadas con el secret) pueden ejecutar esto
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  // En producción, bloquear si no hay secret configurado
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
    // ────────────────────────────────────────────────────────────
    // CASO 1: Suscripciones que vencen en los próximos 3 días
    // Usamos get_user_expiry() para incluir días de referidos ganados.
    // La ventana es: entre ahora+2d y ahora+4d para dar margen al horario del cron.
    // ────────────────────────────────────────────────────────────
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
    console.log(`[CRON] Usuarios con suscripción próxima a vencer: ${expiringSoon.length}`);

    for (const user of expiringSoon) {
      if (!user.email) { results.skipped_no_email++; continue; }
      try {
        await sendSubscriptionExpiringEmail({
          userEmail:    user.email,
          expiryDate:   new Date(user.effective_expiry),
          referralCode: user.referral_code,
        });
        results.expiring_3d_sent++;
        console.log(`[CRON] ✓ Email "vence en 3 días" enviado a ${user.email}`);
      } catch (err) {
        results.expiring_3d_errors++;
        console.error(`[CRON] ✗ Error enviando a ${user.email}:`, err);
      }
    }

    // ────────────────────────────────────────────────────────────
    // CASO 2: Suscripciones que vencieron hoy (últimas 26h para no perder ninguna)
    // ────────────────────────────────────────────────────────────
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
    console.log(`[CRON] Usuarios con suscripción vencida hoy: ${expiredToday.length}`);

    for (const user of expiredToday) {
      if (!user.email) { results.skipped_no_email++; continue; }
      try {
        // Reutilizamos sendSubscriptionExpiringEmail con daysLeft=0
        // El template detecta automáticamente si ya expiró
        await sendSubscriptionExpiringEmail({
          userEmail:    user.email,
          expiryDate:   new Date(user.effective_expiry),
          referralCode: user.referral_code,
        });
        results.expired_sent++;
        console.log(`[CRON] ✓ Email "suscripción vencida" enviado a ${user.email}`);
      } catch (err) {
        results.expired_errors++;
        console.error(`[CRON] ✗ Error enviando a ${user.email}:`, err);
      }
    }

    // ── Notificar al admin si hay errores ────────────────────
    if (results.expiring_3d_errors + results.expired_errors > 0) {
      console.error(`[CRON] ⚠️ ${results.expiring_3d_errors + results.expired_errors} emails fallaron`);
    }

    results.duration_ms = Date.now() - startTime;

    console.log('[CRON] Resumen:', JSON.stringify(results));

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
