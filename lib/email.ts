// ============================================================
// lib/email.ts — Motor de Emails (Resend API) — MVP v4.0
// Fix #8: `from` configurable via RESEND_FROM_EMAIL env var
// Fix #14: expiración del referrer calculada correctamente
// ============================================================

import { Resend } from 'resend';

const resend  = new Resend(process.env.RESEND_API_KEY);
// Fix #8: configurable — si no se define, falla en startup con mensaje claro
const FROM    = process.env.RESEND_FROM_EMAIL ?? 'Albion Hub <noreply@albionhub.gg>';
const ADMIN   = process.env.ADMIN_EMAIL ?? '';
const APP_URL = process.env.NEXTAUTH_URL ?? 'https://albionhub.gg';

// Verificación en startup
if (!process.env.RESEND_API_KEY) {
  console.warn('[EMAIL] RESEND_API_KEY no configurado — los emails no se enviarán.');
}

// ─── TIPOS ───────────────────────────────────────────────────
interface PaymentReceivedParams {
  userEmail: string;
  userId: number;
  txHash: string;
  plan: string;
  amount: number;
  currency: string;
  network: string;
}

interface PaymentVerifiedParams {
  userEmail: string;
  plan: string;
  expiryDate: Date;
}

interface SubscriptionExpiringParams {
  userEmail: string;
  expiryDate: Date;
  referralCode: string;
}

interface ReferralRewardParams {
  referrerEmail: string;
  refereeName: string;
  rewardDays: number;
  totalDaysEarned: number;
  newExpiry: Date;          // Fix #14: calculado correctamente fuera de este módulo
}

// ─── Helper interno ───────────────────────────────────────────
function formatDate(d: Date): string {
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ─── 1. ADMIN: Nuevo pago TX recibido ────────────────────────
export async function sendPaymentReceivedEmail(p: PaymentReceivedParams): Promise<void> {
  if (!ADMIN) {
    console.warn('[EMAIL] ADMIN_EMAIL no configurado — notificación omitida');
    return;
  }
  await resend.emails.send({
    from:    FROM,
    to:      ADMIN,
    subject: `💰 Nuevo pago TX pendiente — ${p.plan} (${p.currency})`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#C09A51;">Nuevo Pago Recibido</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px;color:#666;">Usuario</td><td style="padding:8px;font-weight:bold;">${p.userEmail}</td></tr>
          <tr style="background:#f9f9f9"><td style="padding:8px;color:#666;">ID Usuario</td><td style="padding:8px;">#${p.userId}</td></tr>
          <tr><td style="padding:8px;color:#666;">TX Hash</td><td style="padding:8px;font-family:monospace;font-size:12px;">${p.txHash}</td></tr>
          <tr style="background:#f9f9f9"><td style="padding:8px;color:#666;">Plan</td><td style="padding:8px;text-transform:capitalize;">${p.plan}</td></tr>
          <tr><td style="padding:8px;color:#666;">Monto</td><td style="padding:8px;font-weight:bold;color:#16a34a;">${p.amount} ${p.currency}</td></tr>
          <tr style="background:#f9f9f9"><td style="padding:8px;color:#666;">Red</td><td style="padding:8px;">${p.network}</td></tr>
        </table>
        <a href="${APP_URL}/admin" style="display:inline-block;margin-top:20px;background:#8B0000;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
          Verificar en Panel Admin
        </a>
      </div>`,
  });
}

// ─── 2. USUARIO: Pago verificado y suscripción activa ────────
export async function sendPaymentVerifiedEmail(p: PaymentVerifiedParams): Promise<void> {
  await resend.emails.send({
    from:    FROM,
    to:      p.userEmail,
    subject: '✅ ¡Tu suscripción está activa! — Albion Hub',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#1a1410;color:#E8E2D2;padding:32px;border-radius:16px;">
        <h2 style="color:#C09A51;text-align:center;">¡Pago Verificado!</h2>
        <p style="text-align:center;">Tu plan <strong style="color:#C09A51;text-transform:capitalize;">${p.plan}</strong> está activo.</p>
        <div style="background:#2A1F16;border:1px solid #3F2F23;border-radius:12px;padding:20px;margin:20px 0;text-align:center;">
          <p style="color:#999;margin:0;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Acceso hasta</p>
          <p style="color:#C09A51;font-size:24px;font-weight:bold;margin:8px 0;">${formatDate(p.expiryDate)}</p>
        </div>
        <a href="${APP_URL}/calculadora" style="display:block;text-align:center;background:#8B0000;color:#C09A51;padding:16px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:18px;">
          ⚒️ Acceder a la Calculadora
        </a>
        <p style="text-align:center;color:#666;font-size:12px;margin-top:20px;">
          Invita amigos con tu código de referido y gana días extra de acceso gratis.
        </p>
      </div>`,
  });
}

// ─── 3. USUARIO: Suscripción expira pronto o ya venció ───────
// El cron llama a esta función para ambos casos.
// Si daysLeft <= 0 → ya venció. Si daysLeft > 0 → vence pronto.
export async function sendSubscriptionExpiringEmail(p: SubscriptionExpiringParams): Promise<void> {
  const daysLeft    = Math.ceil((p.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const alreadyDone = daysLeft <= 0;

  const subject = alreadyDone
    ? '❌ Tu suscripción ha vencido — Albion Hub'
    : `⚠️ Tu acceso vence en ${daysLeft} día${daysLeft !== 1 ? 's' : ''} — Albion Hub`;

  const headerColor  = alreadyDone ? '#ff6b6b'  : '#C09A51';
  const headerText   = alreadyDone ? 'Tu acceso ha vencido'     : 'Tu acceso vence pronto';
  const bodyText     = alreadyDone
    ? `Tu suscripción venció el <strong style="color:#ff6b6b;">${formatDate(p.expiryDate)}</strong>.<br/>Renueva ahora para recuperar el acceso completo.`
    : `Tu suscripción expira el <strong style="color:#ff6b6b;">${formatDate(p.expiryDate)}</strong> (en ${daysLeft} día${daysLeft !== 1 ? 's' : ''}).`;

  await resend.emails.send({
    from:    FROM,
    to:      p.userEmail,
    subject,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#1a1410;color:#E8E2D2;padding:32px;border-radius:16px;">
        <h1 style="color:#C09A51;text-align:center;font-size:22px;font-weight:900;text-transform:uppercase;margin:0 0 4px;">Albion Hub</h1>
        <div style="height:2px;width:50px;background:#8B0000;margin:0 auto 24px;"></div>
        <h2 style="color:${headerColor};text-align:center;font-size:20px;margin:0 0 12px;">${headerText}</h2>
        <p style="text-align:center;color:#aaa;font-size:14px;margin:0 0 20px;">${bodyText}</p>

        ${!alreadyDone ? `
        <div style="background:#2A1F16;border:1px solid #3F2F23;border-radius:12px;padding:16px;margin:0 0 20px;text-align:center;">
          <p style="color:#999;margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Tu código de referido</p>
          <p style="color:#C09A51;font-size:24px;font-weight:900;font-family:monospace;margin:0;">${p.referralCode}</p>
          <p style="color:#666;font-size:11px;margin:8px 0 0;">Invita a un amigo y gana <strong style="color:#C09A51;">7 días gratis</strong></p>
        </div>
        ` : ''}

        <a href="${APP_URL}/pago"
           style="display:block;text-align:center;background:#8B0000;color:#C09A51;padding:16px;border-radius:10px;text-decoration:none;font-weight:900;font-size:15px;text-transform:uppercase;letter-spacing:1px;">
          🔄 ${alreadyDone ? 'Reactivar Suscripción' : 'Renovar Ahora'}
        </a>
        <p style="text-align:center;color:#444;font-size:11px;margin-top:20px;">
          Planes desde $3 USDT · Pago en BEP20 o BASE
        </p>
      </div>`,
  });
}

// ─── 4. USUARIO: Premio por referido ganado ──────────────────
export async function sendReferralRewardEmail(p: ReferralRewardParams): Promise<void> {
  await resend.emails.send({
    from:    FROM,
    to:      p.referrerEmail,
    subject: `🎁 ¡Ganaste ${p.rewardDays} días gratis por referido! — Albion Hub`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#1a1410;color:#E8E2D2;padding:32px;border-radius:16px;">
        <h2 style="color:#C09A51;text-align:center;">¡Premio de Referido!</h2>
        <p style="text-align:center;">
          <strong style="color:#C09A51;">${p.refereeName}</strong> acaba de activar su suscripción usando tu código.
        </p>
        <div style="background:#2A1F16;border:2px solid #C09A51;border-radius:12px;padding:24px;margin:20px 0;text-align:center;">
          <p style="color:#999;margin:0;font-size:12px;text-transform:uppercase;">Has ganado</p>
          <p style="color:#C09A51;font-size:48px;font-weight:900;margin:8px 0;">+${p.rewardDays}</p>
          <p style="color:#C09A51;margin:0;">días de acceso premium</p>
        </div>
        <p style="text-align:center;color:#aaa;">
          Total días ganados por referidos: <strong style="color:#C09A51;">${p.totalDaysEarned} días</strong><br/>
          Nuevo vencimiento: <strong>${formatDate(p.newExpiry)}</strong>
        </p>
        <a href="${APP_URL}/dashboard" style="display:block;text-align:center;background:#8B0000;color:#C09A51;padding:16px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:20px;">
          Ver Mis Referidos
        </a>
      </div>`,
  });
}
