// app/api/admin/create-coupon/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { CreateCouponSchema } from '@/lib/validations';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Solo admins
    if (!session?.user || (session.user as { isAdmin?: boolean }).isAdmin !== true) {
      return NextResponse.json({ error: 'Acceso denegado.' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = CreateCouponSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      );
    }

    const { code, reward_days } = parsed.data;

    // Verificar que el código no exista
    const existing = await query<{ id: number }>(
      'SELECT id FROM coupons WHERE code = $1',
      [code]
    );
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Ya existe un cupón con ese código.' }, { status: 409 });
    }

    // Expiración: siempre NOW() + 48 horas (estrategia FOMO)
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const adminId = Number(session.user.id);

    const result = await query<{ id: number; code: string; expires_at: Date }>(
      `INSERT INTO coupons (code, reward_days, expires_at, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING id, code, expires_at`,
      [code, reward_days, expiresAt, adminId]
    );

    return NextResponse.json({
      success: true,
      coupon: result[0],
      message: `Cupón "${code}" creado. Expira en 48h.`,
    });
  } catch (error) {
    console.error('[CREATE_COUPON_ERROR]', error);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
