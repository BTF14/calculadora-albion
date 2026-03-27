'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface DashboardData {
  referral_code: string
  total_referrals: number
  total_days_earned: number
  subscription_expiry: string | null
  role: string
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [data, setData]           = useState<DashboardData | null>(null)
  const [loading, setLoading]     = useState(true)
  const [couponCode, setCouponCode] = useState('')
  const [couponMsg, setCouponMsg]   = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [redeeming, setRedeeming]   = useState(false)
  const [copied, setCopied]         = useState(false)

  const fetchData = useCallback(async () => {
    const res = await fetch('/api/user/dashboard')
    if (res.ok) setData(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return }
    if (status === 'authenticated') fetchData()
  }, [status, fetchData, router])

  const handleCopyReferral = async () => {
    if (!data) return
    const link = `${window.location.origin}/registro?ref=${data.referral_code}`
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRedeemCoupon = async () => {
    if (!couponCode.trim()) return
    setRedeeming(true)
    setCouponMsg(null)
    try {
      const res = await fetch('/api/coupons/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim().toUpperCase() }),
      })
      const json = await res.json()
      if (res.ok) {
        setCouponMsg({ text: json.message, type: 'success' })
        setCouponCode('')
        fetchData()
      } else {
        setCouponMsg({ text: json.error ?? 'Error al canjear.', type: 'error' })
      }
    } catch {
      setCouponMsg({ text: 'Error de conexión.', type: 'error' })
    } finally {
      setRedeeming(false)
    }
  }

  // ── Utilidades ────────────────────────────────────────────
  const daysLeft = data?.subscription_expiry
    ? Math.max(0, Math.ceil(
        (new Date(data.subscription_expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ))
    : 0

  const expiryFormatted = data?.subscription_expiry
    ? new Date(data.subscription_expiry).toLocaleDateString('es-ES', {
        day: 'numeric', month: 'long', year: 'numeric'
      })
    : 'Sin suscripción'

  const subscriptionPercent = Math.min(100, Math.round((daysLeft / 30) * 100))

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[#C09A51] text-xl animate-pulse">Cargando panel...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-[#C09A51] uppercase italic tracking-tighter">
              Mi Panel
            </h1>
            <p className="text-gray-500 text-sm">{session?.user?.email}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
            data?.role === 'premium'
              ? 'bg-[#C09A51]/20 text-[#C09A51] border border-[#C09A51]/40'
              : data?.role === 'admin'
              ? 'bg-red-900/30 text-red-400 border border-red-700'
              : 'bg-gray-800 text-gray-400'
          }`}>
            {data?.role === 'admin' ? '⚔ Admin' : data?.role === 'premium' ? '💎 Premium' : '👤 Guest'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* ── Card: Suscripción ── */}
          <div className="albion-panel rounded-2xl p-6 space-y-4">
            <h2 className="text-[#C09A51] font-black text-sm uppercase tracking-widest border-l-4 border-[#8B0000] pl-3">
              Estado de Suscripción
            </h2>

            <div className="text-center py-4">
              <p className="text-5xl font-black text-white">{daysLeft}</p>
              <p className="text-gray-400 text-sm">días restantes</p>
            </div>

            {/* Barra de progreso */}
            <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all ${
                  daysLeft > 10 ? 'bg-[#C09A51]' : 'bg-red-700'
                }`}
                style={{ width: `${subscriptionPercent}%` }}
              />
            </div>

            <div className="flex justify-between text-[10px] text-gray-500 uppercase">
              <span>Vence: {expiryFormatted}</span>
              <span className={daysLeft <= 3 ? 'text-red-400' : ''}>
                {daysLeft <= 3 && daysLeft > 0 ? '⚠ Renueva pronto' : ''}
              </span>
            </div>

            {daysLeft === 0 && (
              <button
                onClick={() => router.push('/pago')}
                className="w-full py-3 bg-[#8B0000] text-[#C09A51] font-black uppercase text-xs rounded-xl hover:bg-[#a00000] transition-all border border-[#C09A51]/30"
              >
                🔄 Renovar Suscripción
              </button>
            )}
          </div>

          {/* ── Card: Referidos ── */}
          <div className="albion-panel rounded-2xl p-6 space-y-4">
            <h2 className="text-[#C09A51] font-black text-sm uppercase tracking-widest border-l-4 border-[#8B0000] pl-3">
              Motor de Referidos
            </h2>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/40 rounded-xl p-4 text-center">
                <p className="text-3xl font-black text-white">{data?.total_referrals ?? 0}</p>
                <p className="text-gray-500 text-[10px] uppercase mt-1">Jugadores Invitados</p>
              </div>
              <div className="bg-black/40 rounded-xl p-4 text-center">
                <p className="text-3xl font-black text-[#C09A51]">{data?.total_days_earned ?? 0}</p>
                <p className="text-gray-500 text-[10px] uppercase mt-1">Días Ganados</p>
              </div>
            </div>

            {/* Código + Link */}
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold mb-2">Tu código de referido</p>
              <div className="bg-black/60 border border-[#3F2F23] rounded-xl p-3 flex items-center justify-between gap-3">
                <span className="font-mono text-[#C09A51] font-black text-xl tracking-widest">
                  {data?.referral_code ?? '---'}
                </span>
                <button
                  onClick={handleCopyReferral}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                    copied
                      ? 'bg-green-900/30 border-green-500 text-green-400'
                      : 'bg-[#8B0000]/30 border-[#8B0000] text-[#C09A51] hover:bg-[#8B0000]/50'
                  }`}
                >
                  {copied ? '✓ Copiado' : 'Copiar Link'}
                </button>
              </div>
              <p className="text-gray-600 text-[10px] mt-1.5">
                Invita a un jugador → cuando pague, ganas <strong className="text-[#C09A51]">7 días gratis</strong>
              </p>
            </div>
          </div>
        </div>

        {/* ── Card: Cupones FOMO ── */}
        <div className="albion-panel rounded-2xl p-6 space-y-4">
          <h2 className="text-[#C09A51] font-black text-sm uppercase tracking-widest border-l-4 border-[#8B0000] pl-3">
            Canjear Cupón Relámpago ⚡
          </h2>
          <p className="text-gray-400 text-xs">
            ¿Tienes un código promocional? Canjéalo aquí para obtener días extra de acceso.
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Ej: PROMO48H"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleRedeemCoupon()}
              className="albion-input flex-1 font-mono text-sm uppercase rounded-xl"
            />
            <button
              onClick={handleRedeemCoupon}
              disabled={redeeming || !couponCode.trim()}
              className="px-6 py-3 bg-[#8B0000] text-[#C09A51] font-black uppercase text-xs rounded-xl hover:bg-[#a00000] transition-all border border-[#C09A51]/30 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {redeeming ? '...' : 'Canjear'}
            </button>
          </div>
          {couponMsg && (
            <div className={`p-3 rounded-xl text-sm text-center font-medium ${
              couponMsg.type === 'success'
                ? 'bg-green-900/30 border border-green-600 text-green-400'
                : 'bg-red-900/30 border border-red-800 text-red-400'
            }`}>
              {couponMsg.text}
            </div>
          )}
        </div>

        {/* ── Acceso rápido ── */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => router.push('/calculadora')}
            className="albion-panel rounded-2xl p-6 text-center hover:border-[#C09A51] border-2 border-transparent transition-all group"
          >
            <p className="text-4xl mb-2">⚒️</p>
            <p className="text-[#C09A51] font-black uppercase text-sm group-hover:text-white transition-colors">Calculadora</p>
          </button>
          <button
            onClick={() => router.push('/pago')}
            className="albion-panel rounded-2xl p-6 text-center hover:border-[#C09A51] border-2 border-transparent transition-all group"
          >
            <p className="text-4xl mb-2">💎</p>
            <p className="text-[#C09A51] font-black uppercase text-sm group-hover:text-white transition-colors">Renovar Plan</p>
          </button>
        </div>

      </div>
    </div>
  )
}
