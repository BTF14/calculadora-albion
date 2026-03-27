'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { PaymentStatus } from '@/src/types/albion'

interface PendingPayment {
  id: number
  user_id: number
  email: string
  referral_code: string
  tx_hash: string
  plan: string
  amount: number
  currency: string
  network: string
  status: PaymentStatus
  created_at: string
}

interface AdminStats {
  total_users: number
  premium_users: number
  pending_payments: number
  total_revenue_usd: number
  total_referral_grants: number
  active_coupons: number
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [payments, setPayments]     = useState<PendingPayment[]>([])
  const [stats, setStats]           = useState<AdminStats | null>(null)
  const [loading, setLoading]       = useState(true)
  const [activeTab, setActiveTab]   = useState<'payments' | 'coupons'>('payments')
  const [processing, setProcessing] = useState<number | null>(null)

  // Coupon form
  const [couponCode, setCouponCode]   = useState('')
  const [rewardDays, setRewardDays]   = useState(2)
  const [couponMsg, setCouponMsg]     = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [creatingCoupon, setCreatingCoupon] = useState(false)

  const fetchData = useCallback(async () => {
    const [paymentsRes, statsRes] = await Promise.all([
      fetch('/api/admin/payments'),
      fetch('/api/admin/stats'),
    ])
    if (paymentsRes.ok) setPayments(await paymentsRes.json())
    if (statsRes.ok) setStats(await statsRes.json())
    setLoading(false)
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return }
    if (status === 'authenticated') {
      const isAdmin = (session?.user as { isAdmin?: boolean })?.isAdmin
      if (!isAdmin) { router.push('/'); return }
      fetchData()
    }
  }, [status, session, router, fetchData])

  const handleVerify = async (paymentId: number, action: 'verify' | 'reject') => {
    setProcessing(paymentId)
    try {
      const res = await fetch('/api/admin/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: paymentId, action }),
      })
      if (res.ok) {
        setPayments(prev => prev.filter(p => p.id !== paymentId))
        fetchData()
      }
    } finally {
      setProcessing(null)
    }
  }

  const handleCreateCoupon = async () => {
    if (!couponCode.trim()) return
    setCreatingCoupon(true)
    setCouponMsg(null)
    try {
      const res = await fetch('/api/admin/create-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim().toUpperCase(), reward_days: rewardDays }),
      })
      const json = await res.json()
      if (res.ok) {
        setCouponMsg({ text: json.message, type: 'success' })
        setCouponCode('')
        setRewardDays(2)
      } else {
        setCouponMsg({ text: json.error ?? 'Error.', type: 'error' })
      }
    } finally {
      setCreatingCoupon(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[#C09A51] text-xl animate-pulse">Cargando panel admin...</div>
      </div>
    )
  }

  const pendingCount = payments.filter(p => p.status === 'pending').length

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-[#C09A51] uppercase italic tracking-tighter">
              ⚔ Panel Admin
            </h1>
            <p className="text-gray-500 text-sm">Albion Crafting Hub — Control Center</p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-red-900/30 text-red-400 border border-red-700">
            Admin
          </span>
        </div>

        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Total Usuarios',  value: stats.total_users,              color: 'text-white' },
              { label: 'Premium',         value: stats.premium_users,            color: 'text-[#C09A51]' },
              { label: 'Pagos Pend.',     value: stats.pending_payments,         color: pendingCount > 0 ? 'text-red-400' : 'text-green-400' },
              { label: 'Revenue USD',     value: `$${stats.total_revenue_usd}`,  color: 'text-green-400' },
              { label: 'Referidos',       value: stats.total_referral_grants,    color: 'text-blue-400' },
              { label: 'Cupones Activos', value: stats.active_coupons,           color: 'text-yellow-400' },
            ].map(s => (
              <div key={s.label} className="albion-panel rounded-xl p-4 text-center">
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-gray-500 text-[9px] uppercase mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Acceso rápido a Usuarios */}
        <Link
          href="/admin/usuarios"
          className="flex items-center justify-between albion-panel rounded-xl p-4 hover:border-[#C09A51] border-2 border-transparent transition-all group"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">👥</span>
            <div>
              <p className="text-[#C09A51] font-black uppercase text-sm group-hover:text-white transition-colors">
                Gestión de Usuarios
              </p>
              <p className="text-gray-500 text-xs">
                Buscar, extender acceso, cambiar roles · {stats?.total_users ?? '...'} usuarios registrados
              </p>
            </div>
          </div>
          <span className="text-gray-500 group-hover:text-[#C09A51] transition-colors text-lg">→</span>
        </Link>

        {/* Tabs */}
        <div className="flex border-b border-[#3F2F23]">
          {[
            { id: 'payments', label: `💰 Pagos Pendientes${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
            { id: 'coupons',  label: '⚡ Crear Cupón' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'payments' | 'coupons')}
              className={`px-6 py-3 text-sm font-bold uppercase transition-all ${
                activeTab === tab.id
                  ? 'text-[#C09A51] border-b-2 border-[#C09A51]'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Pagos ── */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            {payments.length === 0 ? (
              <div className="albion-panel rounded-2xl p-12 text-center">
                <p className="text-4xl mb-3">✅</p>
                <p className="text-gray-400 text-sm">No hay pagos pendientes de verificación.</p>
              </div>
            ) : (
              payments.map(p => (
                <div key={p.id} className="albion-panel rounded-2xl p-6 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">Usuario</p>
                      <p className="text-white text-sm font-bold">{p.email}</p>
                      <p className="text-gray-500 text-[10px] font-mono">{p.referral_code}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">Plan / Monto</p>
                      <p className="text-[#C09A51] font-black uppercase">{p.plan}</p>
                      <p className="text-green-400 font-bold">{p.amount} {p.currency}</p>
                      <p className="text-gray-500 text-[10px]">Red: {p.network}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">Fecha</p>
                      <p className="text-gray-300 text-sm">
                        {new Date(p.created_at).toLocaleDateString('es-ES', {
                          day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* TX Hash con link */}
                  <div className="bg-black/40 rounded-xl p-3 border border-[#3F2F23]">
                    <p className="text-[10px] text-gray-500 uppercase mb-1">TX Hash</p>
                    <a
                      href={`https://${p.network === 'BEP20' ? 'bscscan.com' : 'basescan.org'}/tx/${p.tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-[#C09A51] hover:text-white transition-colors break-all underline underline-offset-2"
                    >
                      {p.tx_hash}
                    </a>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleVerify(p.id, 'verify')}
                      disabled={processing === p.id}
                      className="flex-1 py-3 bg-green-900/40 border border-green-600 text-green-400 font-black uppercase text-xs rounded-xl hover:bg-green-900/60 transition-all disabled:opacity-40"
                    >
                      {processing === p.id ? '...' : '✓ Verificar Pago'}
                    </button>
                    <button
                      onClick={() => handleVerify(p.id, 'reject')}
                      disabled={processing === p.id}
                      className="flex-[0.4] py-3 bg-red-900/40 border border-red-800 text-red-400 font-black uppercase text-xs rounded-xl hover:bg-red-900/60 transition-all disabled:opacity-40"
                    >
                      ✗ Rechazar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Tab: Cupones ── */}
        {activeTab === 'coupons' && (
          <div className="albion-panel rounded-2xl p-6 md:p-8 space-y-6">
            <div>
              <h2 className="text-[#C09A51] font-black uppercase text-sm border-l-4 border-[#8B0000] pl-3 mb-1">
                Crear Cupón Relámpago ⚡
              </h2>
              <p className="text-gray-500 text-xs">
                Los cupones expiran automáticamente en <strong className="text-[#C09A51]">48 horas</strong> (estrategia FOMO).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase mb-2 block">
                  Código del Cupón
                </label>
                <input
                  type="text"
                  placeholder="Ej: PROMO48H"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                  className="albion-input font-mono text-sm uppercase rounded-xl"
                />
                <p className="text-gray-600 text-[10px] mt-1">Solo letras mayúsculas, números y guiones</p>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase mb-2 block">
                  Días de recompensa
                </label>
                <select
                  value={rewardDays}
                  onChange={e => setRewardDays(Number(e.target.value))}
                  className="albion-input rounded-xl"
                >
                  {[1,2,3,5,7,14,30].map(d => (
                    <option key={d} value={d}>{d} día{d > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Preview */}
            {couponCode && (
              <div className="bg-black/40 border border-[#C09A51]/30 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase">Vista previa</p>
                  <p className="font-mono text-[#C09A51] font-black text-xl">{couponCode}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 uppercase">Regala</p>
                  <p className="text-white font-black">{rewardDays} días</p>
                  <p className="text-gray-500 text-[10px]">Expira en 48h</p>
                </div>
              </div>
            )}

            {couponMsg && (
              <div className={`p-3 rounded-xl text-sm text-center font-medium ${
                couponMsg.type === 'success'
                  ? 'bg-green-900/30 border border-green-600 text-green-400'
                  : 'bg-red-900/30 border border-red-800 text-red-400'
              }`}>
                {couponMsg.text}
              </div>
            )}

            <button
              onClick={handleCreateCoupon}
              disabled={!couponCode.trim() || creatingCoupon}
              className="w-full py-4 bg-[#8B0000] text-[#C09A51] font-black uppercase text-sm rounded-xl hover:bg-[#a00000] transition-all border border-[#C09A51]/30 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {creatingCoupon ? 'Creando...' : '⚡ Generar Cupón Relámpago'}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
