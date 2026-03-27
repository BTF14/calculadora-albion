// app/api/payment/submit/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { SubmitPaymentSchema } from '@/lib/validations';
import { sendPaymentReceivedEmail } from '@/lib/email';
import { paymentRatelimit, getClientIp, rateLimitResponse } from '@/lib/ratelimit';

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const { success: rlOk } = await paymentRatelimit.limit(ip);
    if (!rlOk) return rateLimitResponse();

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
    }

    const userId = Number(session.user.id);
    const body   = await req.json();

    // ── Validación Zod ────────────────────────────────────────
    const parsed = SubmitPaymentSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message ?? 'Datos inválidos';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { tx_hash, plan, currency, network, amount } = parsed.data;

    // ── ¿Ya existe este tx_hash? ──────────────────────────────
    const existing = await query<{ id: number }>(
      'SELECT id FROM payments WHERE tx_hash = $1',
      [tx_hash]
    );
    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Este hash de transacción ya fue registrado.' },
        { status: 409 }
      );
    }

    // ── Guardar pago pendiente ────────────────────────────────
    await query(
      `INSERT INTO payments (user_id, tx_hash, amount, currency, network, plan, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
      [userId, tx_hash, amount, currency, network, plan]
    );

    // ── Notificar al admin ────────────────────────────────────
    const userRows = await query<{ email: string }>(
      'SELECT email FROM users WHERE id = $1',
      [userId]
    );
    const userEmail = userRows[0]?.email ?? 'sin-email';

    try {
      await sendPaymentReceivedEmail({
        userEmail,
        userId,
        txHash: tx_hash,
        plan,
        amount,
        currency,
        network,
      });
    } catch (emailErr) {
      console.error('[PAYMENT_NOTIFY_EMAIL_ERROR]', emailErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Pago enviado. Revisaremos tu transacción pronto.',
    });
  } catch (error) {
    console.error('[SUBMIT_PAYMENT_ERROR]', error);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
