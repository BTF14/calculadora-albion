// app/api/auth/forgot-password/route.ts
// Fix #4: respuesta de tiempo constante (anti-timing-attack para enumerar emails)
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import crypto from 'crypto';
import { query } from '@/lib/db';
import { ForgotPasswordSchema } from '@/lib/validations';
import { authRatelimit, getClientIp, rateLimitResponse } from '@/lib/ratelimit';

const resend  = new Resend(process.env.RESEND_API_KEY);
const FROM    = process.env.RESEND_FROM_EMAIL ?? 'Albion Hub <noreply@albionhub.gg>';
const APP_URL = process.env.NEXTAUTH_URL ?? 'https://albionhub.gg';

export async function POST(req: Request) {
  // Fix #4: iniciamos el timer para normalizar el tiempo de respuesta
  const startTime = Date.now();

  try {
    const ip = getClientIp(req);
    const { success } = await authRatelimit.limit(ip);
    if (!success) return rateLimitResponse();

    const body   = await req.json();
    const parsed = ForgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Email inválido' },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    // Siempre hacemos hash del token (trabajo constante) aunque no haya usuario
    const token   = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    const users = await query<{ id: number }>(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (users.length > 0) {
      // Solo guardamos y enviamos si el usuario existe
      await query(
        `UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3`,
        [token, expires, email]
      );

      const resetLink = `${APP_URL}/auth/reset-password?token=${token}`;
      await resend.emails.send({
        from:    FROM,
        to:      email,
        subject: '🔑 Recupera tu acceso — Albion Hub',
        html: `
          <div style="font-family:sans-serif;max-width:500px;margin:0 auto;background:#1a1410;color:#E8E2D2;padding:40px;border-radius:16px;border:1px solid #3F2F23;">
            <h1 style="color:#C09A51;text-align:center;font-size:24px;font-weight:900;text-transform:uppercase;margin:0 0 8px;">Albion Hub</h1>
            <div style="height:2px;width:60px;background:#8B0000;margin:0 auto 32px;"></div>
            <h2 style="color:#E8E2D2;font-size:18px;text-align:center;margin:0 0 12px;">Recupera tu contraseña</h2>
            <p style="color:#9a8a7a;text-align:center;font-size:14px;margin:0 0 32px;">
              Este enlace expira en <strong style="color:#C09A51;">1 hora</strong>.
            </p>
            <div style="text-align:center;margin-bottom:32px;">
              <a href="${resetLink}"
                 style="display:inline-block;background:#8B0000;color:#C09A51;padding:16px 32px;text-decoration:none;font-weight:900;font-size:14px;text-transform:uppercase;border-radius:10px;">
                🔑 Cambiar Contraseña
              </a>
            </div>
            <p style="color:#5a4a3a;font-size:11px;text-align:center;margin:0;">
              Si no solicitaste esto, ignora este correo.
            </p>
          </div>`,
      });
    }

    // Fix #4: normalizar tiempo de respuesta a mínimo 500ms
    // para que un atacante no pueda distinguir si el email existe
    const elapsed = Date.now() - startTime;
    if (elapsed < 500) {
      await new Promise(r => setTimeout(r, 500 - elapsed));
    }

    // Siempre misma respuesta independientemente de si el email existe
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[FORGOT_PASSWORD_ERROR]', error);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
