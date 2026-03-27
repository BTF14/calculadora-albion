// app/api/admin/stats/route.ts
// Fix #7: try/catch — errores de BD devuelven 500 con mensaje claro
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { isAdmin?: boolean }).isAdmin !== true) {
      return NextResponse.json({ error: 'Acceso denegado.' }, { status: 403 });
    }

    const [users, premium, pending, revenue, referrals, coupons] = await Promise.all([
      query<{ count: string }>('SELECT COUNT(*) AS count FROM users'),
      query<{ count: string }>(`SELECT COUNT(*) AS count FROM users WHERE role = 'premium'`),
      query<{ count: string }>(`SELECT COUNT(*) AS count FROM payments WHERE status = 'pending'`),
      query<{ total: string }>(`SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'verified'`),
      query<{ count: string }>('SELECT COUNT(*) AS count FROM referral_rewards'),
      query<{ count: string }>(`SELECT COUNT(*) AS count FROM coupons WHERE is_redeemed = false AND expires_at > NOW()`),
    ]);

    return NextResponse.json({
      total_users:          Number(users[0]?.count ?? 0),
      premium_users:        Number(premium[0]?.count ?? 0),
      pending_payments:     Number(pending[0]?.count ?? 0),
      total_revenue_usd:    Number(Number(revenue[0]?.total ?? 0).toFixed(2)),
      total_referral_grants: Number(referrals[0]?.count ?? 0),
      active_coupons:       Number(coupons[0]?.count ?? 0),
    });
  } catch (error) {
    console.error('[ADMIN_STATS_ERROR]', error);
    return NextResponse.json({ error: 'Error al obtener estadísticas.' }, { status: 500 });
  }
}
