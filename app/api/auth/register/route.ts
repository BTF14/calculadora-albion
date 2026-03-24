import { NextResponse } from 'next/server'
import { hash } from 'bcrypt'
import { query } from '@/lib/db'

// LISTA BLANCA: Solo estos dominios pueden registrarse
const ALLOWED_DOMAINS = [
  'gmail.com',
  'outlook.com',
  'hotmail.com',
  'yahoo.com',
  'icloud.com',
  'live.com',
  'msn.com'
];

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
    }

    // --- ESCUDO: Validación estricta de Lista Blanca ---
    const emailLower = email.toLowerCase().trim();
    const domain = emailLower.split('@')[1];

    if (!domain || !ALLOWED_DOMAINS.includes(domain)) {
      return NextResponse.json({ 
        error: 'Por seguridad, solo se permiten correos de Gmail, Outlook, Hotmail o Yahoo.' 
      }, { status: 400 })
    }

    // --- VERIFICACIÓN: ¿Ya existe? ---
    const existing = await query('SELECT id FROM users WHERE email = $1', [emailLower])
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Este email ya está en uso' }, { status: 409 })
    }

    const hashedPassword = await hash(password, 10)
    
    // Configuración del Día Gratis (24h)
    const freeTrialExpiration = new Date()
    freeTrialExpiration.setHours(freeTrialExpiration.getHours() + 24)

    // --- GUARDAR EN NEON DB ---
    await query(
      'INSERT INTO users (email, password_hash, subscription_expires_at) VALUES ($1, $2, $3)',
      [emailLower, hashedPassword, freeTrialExpiration]
    )

    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error en el registro:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
