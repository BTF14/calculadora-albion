import { NextResponse } from 'next/server'
import { hash } from 'bcrypt'
import { query } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json()

    // 1. Buscar al usuario por el token y verificar que no haya expirado (NOW() es la hora de Neon)
    const users = await query(
      'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
      [token]
    )

    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 400 })
    }

    const userId = users[0].id

    // 2. Encriptar la nueva contraseña con bcrypt
    const hashedPassword = await hash(password, 10)

    // 3. Actualizar la clave y limpiar los campos del token para que no se use de nuevo
    await query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [hashedPassword, userId]
    )

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error al resetear clave:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
