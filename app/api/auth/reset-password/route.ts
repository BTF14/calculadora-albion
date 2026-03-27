// app/api/auth/reset-password/route.ts
import { NextResponse } from 'next/server';
import { hash } from 'bcrypt';
import { query } from '@/lib/db';
import { ResetPasswordSchema } from '@/lib/validations';
import { authRatelimit, getClientIp, rateLimitResponse } from '@/lib/ratelimit';

export async function POST(req: Request) {
  try {
    // ── Rate limiting ─────────────────────────────────────────
    const ip = getClientIp(req);
    const { success } = await authRatelimit.limit(ip);
    if (!success) return rateLimitResponse();

    // ── Validación Zod ────────────────────────────────────────
    const body   = await req.json();
    const parsed = ResetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;

    // ── Validar token vigente ─────────────────────────────────
    const users = await query<{ id: number }>(
      `SELECT id FROM users
       WHERE reset_token = $1
         AND reset_token_expires > NOW()`,
      [token]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'El enlace es inválido o ha expirado. Solicita uno nuevo.' },
        { status: 400 }
      );
    }

    const userId      = users[0].id;
    const hashedPass  = await hash(password, 10);

    // ── Actualizar contraseña y limpiar token ─────────────────
    await query(
      `UPDATE users
       SET password_hash          = $1,
           reset_token            = NULL,
           reset_token_expires    = NULL
       WHERE id = $2`,
      [hashedPass, userId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[RESET_PASSWORD_ERROR]', error);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
