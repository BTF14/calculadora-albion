import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { query } from '@/lib/db'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const formData = await req.formData()
  const paymentId = formData.get('paymentId') as string
  const plan = formData.get('plan') as string
  if (!paymentId || !plan) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
  }

  const payment = await query(
    'SELECT user_id FROM payments WHERE id = $1 AND status = $2',
    [paymentId, 'pending']
  )
  if (payment.length === 0) {
    return NextResponse.json({ error: 'Pago no encontrado o ya procesado' }, { status: 404 })
  }

  const userId = payment[0].user_id
  let expiresAt: Date | null = null
  if (plan === 'weekly') {
    expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)
  } else if (plan === 'monthly') {
    expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)
  } else if (plan === 'yearly') {
    expiresAt = new Date()
    expiresAt.setFullYear(expiresAt.getFullYear() + 1)
  }

  await query(
    'UPDATE payments SET status = $1, verified_by = $2 WHERE id = $3',
    ['verified', session.user.id, paymentId]
  )
  await query(
    'UPDATE users SET subscription_type = $1, subscription_expires_at = $2, payment_verified_at = now() WHERE id = $3',
    [plan, expiresAt, userId]
  )

  return NextResponse.redirect(new URL('/admin', req.url))
}
