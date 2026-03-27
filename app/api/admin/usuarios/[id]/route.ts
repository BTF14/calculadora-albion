// app/api/admin/usuarios/[id]/route.ts
// GET   → detalle completo del usuario (historial pagos, referidos, suscripciones)
// PATCH → acciones admin: extender días, cambiar rol, revocar acceso
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { AdminUpdateUserSchema } from '@/lib/validations';

// ─── GET: Detalle completo ─────────────────────────────────────
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { isAdmin?: boolean }).isAdmin !== true) {
      return NextResponse.json({ error: 'Acceso denegado.' }, { status: 403 });
    }

    const userId = Number(params.id);
    if (isNaN(userId) || userId <= 0) {
      return NextResponse.json({ error: 'ID de usuario inválido.' }, { status: 400 });
    }

    // Info base del usuario
    const userRows = await query<{
      id: number;
      email: string;
      role: string;
      referral_code: string;
      referred_by: number | null;
      created_at: string;
      effective_expiry: string | null;
    }>(
      `SELECT
         u.id, u.email, u.role, u.referral_code, u.referred_by, u.created_at,
         get_user_expiry(u.id) AS effective_expiry
       FROM users u
       WHERE u.id = $1`,
      [userId]
    );

    if (!userRows[0]) {
      return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
    }

    // Email del referrer (quien lo invitó)
    let referredByEmail: string | null = null;
    if (userRows[0].referred_by) {
      const refRows = await query<{ email: string }>(
        'SELECT email FROM users WHERE id = $1',
        [userRows[0].referred_by]
      );
      referredByEmail = refRows[0]?.email ?? null;
    }

    // Historial de suscripciones
    const subscriptions = await query<{
      id: number;
      plan: string;
      expiry_date: string;
      free_trial_used: boolean;
      created_at: string;
    }>(
      `SELECT id, plan, expiry_date, free_trial_used, created_at
       FROM subscriptions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId]
    );

    // Historial de pagos
    const payments = await query<{
      id: number;
      tx_hash: string;
      plan: string;
      amount: number;
      currency: string;
      network: string;
      status: string;
      created_at: string;
      verified_at: string | null;
    }>(
      `SELECT id, tx_hash, plan, amount, currency, network, status, created_at, verified_at
       FROM payments
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    // Usuarios que este user invitó (referidos)
    const referrals = await query<{
      id: number;
      email: string;
      role: string;
      reward_days: number;
      granted_at: string;
    }>(
      `SELECT u.id, u.email, u.role, rr.reward_days, rr.granted_at
       FROM referral_rewards rr
       JOIN users u ON u.id = rr.referee_id
       WHERE rr.referrer_id = $1
       ORDER BY rr.granted_at DESC`,
      [userId]
    );

    // Cupones canjeados por este usuario
    const coupons = await query<{
      code: string;
      reward_days: number;
      redeemed_at: string;
    }>(
      `SELECT c.code, c.reward_days, c.created_at AS redeemed_at
       FROM coupons c
       WHERE c.redeemed_by = $1
       ORDER BY c.created_at DESC`,
      [userId]
    );

    return NextResponse.json({
      user: {
        ...userRows[0],
        referred_by_email: referredByEmail,
        is_active: userRows[0].effective_expiry
          ? new Date(userRows[0].effective_expiry) > new Date()
          : false,
      },
      subscriptions,
      payments,
      referrals,
      coupons,
      summary: {
        total_paid:           payments.filter(p => p.status === 'verified').reduce((s, p) => s + Number(p.amount), 0),
        total_referrals:      referrals.length,
        total_referral_days:  referrals.reduce((s, r) => s + r.reward_days, 0),
        total_coupons_used:   coupons.length,
      },
    });
  } catch (error) {
    console.error('[ADMIN_USER_DETAIL_ERROR]', error);
    return NextResponse.json({ error: 'Error al obtener el usuario.' }, { status: 500 });
  }
}

// ─── PATCH: Acciones sobre el usuario ──────────────────────────
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as { isAdmin?: boolean }).isAdmin !== true) {
      return NextResponse.json({ error: 'Acceso denegado.' }, { status: 403 });
    }

    const userId = Number(params.id);
    if (isNaN(userId) || userId <= 0) {
      return NextResponse.json({ error: 'ID de usuario inválido.' }, { status: 400 });
    }

    // Prevenir que el admin se modifique a sí mismo de forma accidental
    if (userId === Number(session.user.id)) {
      return NextResponse.json(
        { error: 'No puedes modificar tu propia cuenta desde aquí.' },
        { status: 400 }
      );
    }

    const body   = await req.json();
    const parsed = AdminUpdateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      );
    }

    const { action, days, role } = parsed.data;

    // Verificar que el usuario existe
    const existing = await query<{ id: number; email: string }>(
      'SELECT id, email FROM users WHERE id = $1',
      [userId]
    );
    if (!existing[0]) {
      return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
    }

    // ── Acción: Extender días de suscripción ────────────────
    if (action === 'extend_days' && days) {
      const currentSub = await query<{ expiry_date: string }>(
        `SELECT expiry_date FROM subscriptions
         WHERE user_id = $1 ORDER BY expiry_date DESC LIMIT 1`,
        [userId]
      );

      const baseExpiry    = currentSub[0]?.expiry_date
        ? new Date(currentSub[0].expiry_date)
        : new Date();
      const effectiveBase = baseExpiry > new Date() ? baseExpiry : new Date();
      const newExpiry     = new Date(effectiveBase.getTime() + days * 86400 * 1000);

      await query(
        `INSERT INTO subscriptions (user_id, expiry_date, plan)
         VALUES ($1, $2, 'monthly')`,
        [userId, newExpiry]
      );

      // Asegurar que el role sea premium si se extiende el acceso
      await query(
        `UPDATE users SET role = 'premium' WHERE id = $1 AND role = 'guest'`,
        [userId]
      );

      return NextResponse.json({
        success:    true,
        action,
        message:    `✓ ${days} días agregados. Nuevo vencimiento: ${newExpiry.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`,
        new_expiry: newExpiry.toISOString(),
      });
    }

    // ── Acción: Cambiar rol ──────────────────────────────────
    if (action === 'change_role' && role) {
      await query(
        'UPDATE users SET role = $1 WHERE id = $2',
        [role, userId]
      );

      // Si se degrada a guest, insertar suscripción con expiración en el pasado
      if (role === 'guest') {
        await query(
          `INSERT INTO subscriptions (user_id, expiry_date, plan)
           VALUES ($1, NOW() - INTERVAL '1 second', 'trial')`,
          [userId]
        );
      }

      return NextResponse.json({
        success: true,
        action,
        message: `✓ Rol actualizado a "${role}" para ${existing[0].email}`,
        new_role: role,
      });
    }

    // ── Acción: Revocar acceso inmediatamente ────────────────
    if (action === 'revoke_access') {
      await query(
        `INSERT INTO subscriptions (user_id, expiry_date, plan)
         VALUES ($1, NOW() - INTERVAL '1 second', 'trial')`,
        [userId]
      );
      await query(
        `UPDATE users SET role = 'guest' WHERE id = $1`,
        [userId]
      );

      return NextResponse.json({
        success: true,
        action,
        message: `✓ Acceso revocado para ${existing[0].email}`,
      });
    }

    return NextResponse.json({ error: 'Acción no reconocida.' }, { status: 400 });
  } catch (error) {
    console.error('[ADMIN_USER_UPDATE_ERROR]', error);
    return NextResponse.json({ error: 'Error al actualizar el usuario.' }, { status: 500 });
  }
}
