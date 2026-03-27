// app/api/user/dashboard/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
    }

    const userId = Number(session.user.id);

    // Usuario + expiración efectiva (suscripción + referidos)
    const userRows = await query<{
      referral_code: string;
      role: string;
    }>(
      'SELECT referral_code, role FROM users WHERE id = $1',
      [userId]
    );

    if (!userRows[0]) {
      return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
    }

    // Expiración efectiva usando la función SQL
    const expiryRows = await query<{ expiry: string }>(
      'SELECT get_user_expiry($1)::text AS expiry',
      [userId]
    );

    // Stats de referidos
    const referralStats = await query<{
      total_referrals: string;
      total_days: string;
    }>(
      `SELECT
         COUNT(*) AS total_referrals,
         COALESCE(SUM(reward_days), 0) AS total_days
       FROM referral_rewards
       WHERE referrer_id = $1`,
      [userId]
    );

    return NextResponse.json({
      referral_code:       userRows[0].referral_code,
      role:                userRows[0].role,
      subscription_expiry: expiryRows[0]?.expiry ?? null,
      total_referrals:     Number(referralStats[0]?.total_referrals ?? 0),
      total_days_earned:   Number(referralStats[0]?.total_days ?? 0),
    });
  } catch (error) {
    console.error('[DASHBOARD_ERROR]', error);
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 });
  }
}
