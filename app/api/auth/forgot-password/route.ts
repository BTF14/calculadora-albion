import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { Resend } from 'resend'
import crypto from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    const user = await query('SELECT id FROM users WHERE email = $1', [email])
    if (user.length === 0) return NextResponse.json({ error: 'No existe' }, { status: 404 })

    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 3600000)

    await query('UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3', [token, expires, email])

    const resetLink = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`
    
    await resend.emails.send({
      from: 'Albion Calc <onboarding@resend.dev>',
      to: email,
      subject: 'Recuperar contraseña - Albion Calc',
      html: `<div style="background:#1a1025;color:white;padding:20px;text-align:center;border-radius:10px;font-family:sans-serif;">
              <h2 style="color:#a855f7;">Recupera tu cuenta</h2>
              <p>Haz clic abajo para cambiar tu clave:</p>
              <a href="${resetLink}" style="background:#7c3aed;color:white;padding:12px 25px;text-decoration:none;border-radius:5px;font-weight:bold;display:inline-block;">Cambiar Contraseña</a>
              <p style="font-size:12px;color:#94a3b8;margin-top:20px;">Este enlace expira en 1 hora.</p>
             </div>`
    })
    return NextResponse.json({ success: true })
  } catch (e) { return NextResponse.json({ error: 'Error interno' }, { status: 500 }) }
}
