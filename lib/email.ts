import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPaymentEmail({ userEmail, screenshotUrl, userId, plan }: {
  userEmail: string;
  screenshotUrl: string;
  userId: string;
  plan: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) throw new Error('ADMIN_EMAIL no configurado');

  await resend.emails.send({
    from: 'Calculadora <noreply@tudominio.com>',
    to: adminEmail,
    subject: 'Nuevo pago pendiente de verificación',
    html: `
      <p>Usuario: ${userEmail}</p>
      <p>ID: ${userId}</p>
      <p>Plan seleccionado: <strong>${plan}</strong></p>
      <p>Captura: <a href="${screenshotUrl}">${screenshotUrl}</a></p>
      <p><a href="${process.env.NEXTAUTH_URL}/admin">Ir al panel de administración</a></p>
    `,
  });
}
