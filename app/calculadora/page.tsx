'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function CalculadoraPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  if (status === 'loading') return <div>Cargando...</div>
  if (!session) {
    router.push('/login')
    return null
  }

  const hasSubscription = session.user?.subscriptionExpiresAt
    ? new Date(session.user.subscriptionExpiresAt) > new Date()
    : false
  if (!hasSubscription) {
    router.push('/pago')
    return null
  }

  return (
    <div className="max-w-4xl mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-6">Calculadora de crafteo</h1>
      <p className="text-gray-600">Aquí se mostrarán los formularios y resultados.</p>
    </div>
  )
}
