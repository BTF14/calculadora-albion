// app/api/admin/payments/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { isAdmin?: boolean }).isAdmin !== true) {
    return NextResponse.json({ error: 'Acceso denegado.' }, { status: 403 });
  }

  const payments = await query(
    `SELECT
       p.id, p.user_id, p.tx_hash, p.plan, p.amount, p.currency,
       p.network, p.status, p.created_at,
       u.email, u.referral_code
     FROM payments p
     JOIN users u ON p.user_id = u.id
     WHERE p.status = 'pending'
     ORDER BY p.created_at DESC`
  );

  return NextResponse.json(payments);
}
