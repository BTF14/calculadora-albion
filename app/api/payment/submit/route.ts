import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { put } from '@vercel/blob'
import { query } from '@/lib/db'
import { sendPaymentEmail } from '@/lib/email'
import { authOptions } from '@/lib/auth'
import { ratelimit } from '@/lib/ratelimit'

const ALLOWED_PLANS = ['weekly', 'monthly', 'yearly']

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { success } = await ratelimit.limit(session.user.id)
  if (!success) {
    return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 })
  }

  const formData = await req.formData()
  const file = formData.get('screenshot') as File
  const plan = formData.get('plan') as string

  if (!file || !plan) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  }

  if (!ALLOWED_PLANS.includes(plan)) {
    return NextResponse.json({ error: 'Plan no válido' }, { status: 400 })
  }

  if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Imagen inválida (máx 5MB)' }, { status: 400 })
  }

  const blob = await put(`payments/${session.user.id}-${Date.now()}.png`, file, {
    access: 'authenticated-read', // ← aquí está la corrección
  })

  await query(
    'INSERT INTO payments (user_id, screenshot_url, status, plan) VALUES ($1, $2, $3, $4)',
    [session.user.id, blob.url, 'pending', plan]
  )

  await sendPaymentEmail({
    userEmail: session.user.email!,
    screenshotUrl: blob.url,
    userId: session.user.id,
    plan,
  })

  return NextResponse.json({ success: true })
}
