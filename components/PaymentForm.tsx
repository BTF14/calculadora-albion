'use client'

// Este componente fue migrado a app/pago/page.tsx (flujo tx_hash v4.0)
// Se mantiene como redirect para compatibilidad con imports existentes.
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PaymentForm() {
  const router = useRouter()
  useEffect(() => { router.replace('/pago') }, [router])
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <p className="text-[#C09A51] animate-pulse text-sm">Redirigiendo al módulo de pagos...</p>
    </div>
  )
}
