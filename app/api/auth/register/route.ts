import { NextResponse } from 'next/server'
import { hash } from 'bcrypt'
import { query } from '@/lib/db'

export async function POST(req: Request) {
  const { email, password } = await req.json()
  if (!email || !password) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  }

  const existing = await query('SELECT id FROM users WHERE email = $1', [email])
  if (existing.length > 0) {
    return NextResponse.json({ error: 'El email ya está registrado' }, { status: 409 })
  }

  const hashedPassword = await hash(password, 10)
  await query(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2)',
    [email, hashedPassword]
  )

  return NextResponse.json({ success: true })
}
