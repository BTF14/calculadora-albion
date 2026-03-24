import { NextResponse } from 'next/server'
import { hash } from 'bcrypt'
import { query } from '@/lib/db'

export async function POST(req: Request) {
  const { email, password } = await req.json()
  
  if (!email || !password) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  }

  try {
    // 1. Verificar si el usuario ya existe
    const existing = await query('SELECT id FROM users WHERE email = $1', [email])
    if (existing.length > 0) {
      return NextResponse.json({ error: 'El email ya está registrado' }, { status: 409 })
    }

    // 2. Encriptar la contraseña
    const hashedPassword = await hash(password, 10)

    // 3. CALCULAR EL DÍA GRATIS (Fecha actual + 24 horas)
    const subscriptionExpiresAt = new Date()
    subscriptionExpiresAt.setHours(subscriptionExpiresAt.getHours() + 24)

    // 4. Insertar el nuevo usuario con su regalo de 24 horas
    // NOTA: Asegúrate de que tu tabla 'users' tenga la columna 'subscription_expires_at'
    await query(
      'INSERT INTO users (email, password_hash, subscription_expires_at) VALUES ($1, $2, $3)',
      [email, hashedPassword, subscriptionExpiresAt]
    )

    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error en el registro:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
