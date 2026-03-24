const fs = require('fs');
const path = require('path');

const folders = [
  'app/auth/forgot-password',
  'app/auth/reset-password',
  'app/api/auth/forgot-password',
  'app/api/auth/reset-password'
];

const files = {
  // 1. PANTALLA: Solicitar correo
  'app/auth/forgot-password/page.tsx': `'use client'
import { useState } from 'react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
    if (res.ok) setMessage('Revisa tu correo. Te enviamos un link de recuperación.')
    else setMessage('Error: El correo no está registrado.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1025] text-white p-4">
      <form onSubmit={handleSubmit} className="p-8 bg-[#2d1b4d] rounded-2xl shadow-xl w-full max-w-md border border-purple-900">
        <h1 className="text-2xl font-bold mb-4 text-center">Recuperar Acceso</h1>
        <input type="email" placeholder="tu-correo@gmail.com" className="w-full p-3 rounded-lg bg-[#3d2566] border border-purple-500 mb-4 outline-none" onChange={(e) => setEmail(e.target.value)} required />
        <button className="w-full bg-purple-600 hover:bg-purple-700 p-3 rounded-lg font-bold transition">Enviar enlace</button>
        {message && <p className="mt-4 text-center text-purple-300">{message}</p>}
      </form>
    </div>
  )`,

  // 2. LÓGICA: Generar Token y enviar Email con Resend
  'app/api/auth/forgot-password/route.ts': `import { NextResponse } from 'next/server'
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

    const resetLink = \`\${process.env.NEXTAUTH_URL}/auth/reset-password?token=\${token}\`
    
    await resend.emails.send({
      from: 'Albion Calc <onboarding@resend.dev>',
      to: email,
      subject: 'Recuperar contraseña',
      html: \`<div style="background:#1a1025;color:white;padding:20px;"><a href="\${resetLink}">Click aquí para cambiar clave</a></div>\`
    })

    return NextResponse.json({ success: true })
  } catch (e) { return NextResponse.json({ error: 'Error' }, { status: 500 }) }
}`,

  // 3. PANTALLA: Poner la clave nueva
  'app/auth/reset-password/page.tsx': `'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    })
    if (res.ok) {
      setMessage('¡Cambiado! Redirigiendo...')
      setTimeout(() => router.push('/login'), 2000)
    } else setMessage('Error al cambiar clave.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1025] text-white p-4">
      <form onSubmit={handleSubmit} className="p-8 bg-[#2d1b4d] rounded-2xl shadow-xl w-full max-w-md border border-purple-900">
        <h1 className="text-2xl font-bold mb-4 text-center">Nueva Clave</h1>
        <input type="password" placeholder="Nueva contraseña" className="w-full p-3 rounded-lg bg-[#3d2566] border border-purple-500 mb-4 outline-none" onChange={(e) => setPassword(e.target.value)} required />
        <button className="w-full bg-purple-600 hover:bg-purple-700 p-3 rounded-lg font-bold">Actualizar</button>
        {message && <p className="mt-4 text-center text-purple-300">{message}</p>}
      </form>
    </div>
  )`,

  // 4. LÓGICA: Validar token y actualizar DB en Neon
  'app/api/auth/reset-password/route.ts': `import { NextResponse } from 'next/server'
import { hash } from 'bcrypt'
import { query } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json()
    const users = await query('SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()', [token])
    if (users.length === 0) return NextResponse.json({ error: 'Token inválido' }, { status: 400 })

    const hashedPassword = await hash(password, 10)
    await query('UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2', [hashedPassword, users[0].id])

    return NextResponse.json({ success: true })
  } catch (e) { return NextResponse.json({ error: 'Error' }, { status: 500 }) }
}`
};

// CREAR CARPETAS
folders.forEach(f => fs.mkdirSync(path.join(process.cwd(), f), { recursive: true }));

// CREAR ARCHIVOS
Object.entries(files).forEach(([p, content]) => fs.writeFileSync(path.join(process.cwd(), p), content));

console.log('✅ Sistema de recuperación de contraseña instalado con éxito, Eduardo.');
