// app/api/admin/verify-payment/route.ts
// Fix #1: transacción SQL atómica
// Fix #5: suscripción actualizada para que el middleware la refleje
// Fix #14: expiración del referrer calculada correctamente con get_user_expiry()
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, query } from '@/lib/db';
import { VerifyPaymentSchema } from '@/lib/validations';
import { grantReferralReward } from '@/lib/referral';
import { sendPaymentVerifiedEmail, sendReferralRewardEmail } from '@/lib/email';

const PLAN_DAYS: Record<string, number> = {
  weekly:  7,
  monthly: 30,
  yearly:  365,
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { isAdmin?: boolean }).isAdmin !== true) {
      return NextResponse.json({ error: 'Acceso denegado.' }, { status: 403 });
    }

    const body   = await req.json();
    const parsed = VerifyPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      );
    }

    const { payment_id, action } = parsed.data;
    const adminId = Number(session.user.id);

    const payments = await query<{ id: number; user_id: number; plan: string; status: string }>(
      `SELECT id, user_id, plan, status FROM payments
       WHERE id = $1 AND status = 'pending'`,
      [payment_id]
    );

    const payment = payments[0];
    if (!payment) {
      return NextResponse.json({ error: 'Pago no encontrado o ya procesado.' }, { status: 404 });
    }

    if (action === 'reject') {
      await query(
        `UPDATE payments SET status = 'rejected', verified_by = $1, verified_at = NOW()
         WHERE id = $2`,
        [adminId, payment_id]
      );
      return NextResponse.json({ success: true, action: 'rejected' });
    }

    // ── Calcular nueva expiración ─────────────────────────────
    const days = PLAN_DAYS[payment.plan] ?? 30;
    const currentSub = await query<{ expiry_date: string }>(
      `SELECT expiry_date FROM subscriptions
       WHERE user_id = $1 ORDER BY expiry_date DESC LIMIT 1`,
      [payment.user_id]
    );

    const baseExpiry    = currentSub[0]?.expiry_date ? new Date(currentSub[0].expiry_date) : new Date();
    const effectiveBase = baseExpiry > new Date() ? baseExpiry : new Date();
    const newExpiry     = new Date(effectiveBase.getTime() + days * 86400 * 1000);

    // Fix #1: todas las operaciones en una transacción atómica
    await db`BEGIN`;
    try {
      await query(
        `UPDATE payments SET status = 'verified', verified_by = $1, verified_at = NOW()
         WHERE id = $2`,
        [adminId, payment_id]
      );

      await query(
        `INSERT INTO subscriptions (user_id, expiry_date, plan)
         VALUES ($1, $2, $3)`,
        [payment.user_id, newExpiry, payment.plan]
      );

      await query(
        `UPDATE users SET role = 'premium' WHERE id = $1`,
        [payment.user_id]
      );

      await db`COMMIT`;
    } catch (txErr) {
      await db`ROLLBACK`;
      throw txErr;
    }

    // ── Referidos y emails (fuera de la transacción — no bloquean el pago) ──
    const userRows = await query<{ email: string; referred_by: number | null }>(
      `SELECT email, referred_by FROM users WHERE id = $1`,
      [payment.user_id]
    );
    const userEmail = userRows[0]?.email ?? '';

    // Otorgar premio al referrer (ON CONFLICT DO NOTHING — atómico)
    await grantReferralReward(payment.user_id);

    // Fix #5: Notificar al referrer si aplica
    if (userRows[0]?.referred_by) {
      try {
        const referrerId  = userRows[0].referred_by;

        // Fix #14: usar get_user_expiry() para obtener la expiración REAL del referrer
        // (ya incluye los días de referidos previos + el nuevo que acabamos de insertar)
        const referrerExpiryRows = await query<{ expiry: string }>(
          'SELECT get_user_expiry($1)::text AS expiry',
          [referrerId]
        );
        const referrerNewExpiry = referrerExpiryRows[0]?.expiry
          ? new Date(referrerExpiryRows[0].expiry)
          : new Date();

        // Obtener totales actualizados
        const totals = await query<{ total_days: string }>(
          `SELECT COALESCE(SUM(reward_days), 0) AS total_days
           FROM referral_rewards WHERE referrer_id = $1`,
          [referrerId]
        );
        const totalDaysEarned = Number(totals[0]?.total_days ?? 0);

        const referrerRows = await query<{ email: string }>(
          'SELECT email FROM users WHERE id = $1',
          [referrerId]
        );

        if (referrerRows[0]?.email) {
          await sendReferralRewardEmail({
            referrerEmail:   referrerRows[0].email,
            refereeName:     userEmail.split('@')[0] ?? 'Un jugador',
            rewardDays:      7,
            totalDaysEarned,
            newExpiry:       referrerNewExpiry,
          });
        }
      } catch (emailErr) {
        console.error('[REFERRAL_EMAIL_ERROR]', emailErr);
      }
    }

    try {
      await sendPaymentVerifiedEmail({ userEmail, plan: payment.plan, expiryDate: newExpiry });
    } catch (emailErr) {
      console.error('[VERIFIED_EMAIL_ERROR]', emailErr);
    }

    return NextResponse.json({
      success:    true,
      action:     'verified',
      new_expiry: newExpiry.toISOString(),
    });
  } catch (error) {
    console.error('[VERIFY_PAYMENT_ERROR]', error);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
