'use client'

import { useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import QRCode from 'qrcode.react'
import type { SubscriptionPlan, PaymentCurrency, PaymentNetwork } from '@/src/types/albion'

interface PaymentOption {
  id: string
  network: PaymentNetwork
  currency: PaymentCurrency
  asset: string
  address: string
}

// Fix #12: dirección desde env var (no hardcoded en código)
const WALLET = process.env.NEXT_PUBLIC_PAYMENT_ADDRESS ?? '0x0000000000000000000000000000000000000000'

const PAYMENT_OPTIONS: PaymentOption[] = [
  { id: 'usdt-bep20', network: 'BEP20', currency: 'USDT', asset: 'Tether (USDT)',         address: WALLET },
  { id: 'usdc-base',  network: 'BASE',  currency: 'USDC', asset: 'USD Coin (USDC)',        address: WALLET },
  { id: 'usdt-base',  network: 'BASE',  currency: 'USDT', asset: 'Bridged Tether (USDT)',  address: WALLET },
  { id: 'usdc-bep20', network: 'BEP20', currency: 'USDC', asset: 'BNB pegged USDC',        address: WALLET },
]

interface PlanConfig {
  label: string
  days: number
  priceUSDT: number
  priceUSDC: number
  badge: string
}

// Fix #12: leer precios de env vars con fallback razonable
function parsePriceEnv(key: string, fallback: number): number {
  const val = process.env[key]
  if (!val) return fallback
  const n = Number(val)
  return isNaN(n) || n <= 0 ? fallback : n
}

const PLANS: Record<SubscriptionPlan, PlanConfig> = {
  trial:   { label: 'Trial',   days: 1,   priceUSDT: 0,   priceUSDC: 0,   badge: '' },
  weekly:  { label: 'Semanal', days: 7,
    priceUSDT: parsePriceEnv('NEXT_PUBLIC_WEEKLY_PRICE_USDT',  3),
    priceUSDC: parsePriceEnv('NEXT_PUBLIC_WEEKLY_PRICE_USDC',  3),
    badge: '' },
  monthly: { label: 'Mensual', days: 30,
    priceUSDT: parsePriceEnv('NEXT_PUBLIC_MONTHLY_PRICE_USDT', 10),
    priceUSDC: parsePriceEnv('NEXT_PUBLIC_MONTHLY_PRICE_USDC', 10),
    badge: '🔥 Popular' },
  yearly:  { label: 'Anual',   days: 365,
    priceUSDT: parsePriceEnv('NEXT_PUBLIC_YEARLY_PRICE_USDT',  100),
    priceUSDC: parsePriceEnv('NEXT_PUBLIC_YEARLY_PRICE_USDC',  100),
    badge: '💎 Mejor Valor' },
}

export default function PagoPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [selectedOption, setSelectedOption] = useState<PaymentOption>(PAYMENT_OPTIONS[0])
  const [selectedPlan, setSelectedPlan]     = useState<SubscriptionPlan>('monthly')
  const [txHash, setTxHash]                 = useState('')
  const [submitting, setSubmitting]         = useState(false)
  const [copied, setCopied]                 = useState(false)
  const [message, setMessage]               = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [step, setStep]                     = useState<1 | 2 | 3>(1)

  const planConfig  = PLANS[selectedPlan]
  const price       = selectedOption.currency === 'USDC' ? planConfig.priceUSDC : planConfig.priceUSDT
  const txHashValid = useMemo(() => /^0x[a-fA-F0-9]{64}$/.test(txHash), [txHash])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[#C09A51] text-xl animate-pulse">Verificando sesión...</div>
      </div>
    )
  }
  if (!session) { router.push('/login'); return null }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(selectedOption.address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = async () => {
    if (!txHashValid) {
      setMessage({ text: 'El TX Hash debe ser 0x + 64 caracteres hexadecimales.', type: 'error' })
      return
    }
    setSubmitting(true)
    setMessage(null)
    try {
      const res = await fetch('/api/payment/submit', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          tx_hash:  txHash.trim(),
          plan:     selectedPlan,
          currency: selectedOption.currency,
          network:  selectedOption.network,
          amount:   price,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setStep(3)
        setMessage({ text: '¡TX enviado! Un admin verificará tu pago en las próximas horas.', type: 'success' })
      } else {
        setMessage({ text: data.error ?? 'Error al enviar la transacción.', type: 'error' })
      }
    } catch {
      setMessage({ text: 'Error de conexión. Intenta de nuevo.', type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">

        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-[#C09A51] uppercase italic tracking-tighter">
            Activar Suscripción
          </h1>
          <div className="h-0.5 w-20 bg-[#8B0000] mx-auto mt-2" />
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {([1, 2, 3] as const).map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black border-2 transition-all ${
                step >= s
                  ? 'bg-[#8B0000] border-[#C09A51] text-[#C09A51]'
                  : 'bg-black/40 border-[#3F2F23] text-gray-600'
              }`}>{s}</div>
              {s < 3 && <div className={`w-10 h-0.5 ${step > s ? 'bg-[#C09A51]' : 'bg-[#3F2F23]'}`} />}
            </div>
          ))}
        </div>

        <div className="albion-panel rounded-2xl overflow-hidden">

          {/* Step 1: Plan + Red */}
          {step === 1 && (
            <div className="p-6 md:p-10 space-y-8">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">1 — Elige tu Plan</p>
                <div className="grid grid-cols-1 gap-3">
                  {(['weekly', 'monthly', 'yearly'] as const).map(plan => {
                    const cfg    = PLANS[plan]
                    const active = selectedPlan === plan
                    const p      = selectedOption.currency === 'USDC' ? cfg.priceUSDC : cfg.priceUSDT
                    return (
                      <button
                        key={plan}
                        onClick={() => setSelectedPlan(plan)}
                        className={`relative flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
                          active ? 'border-[#C09A51] bg-[#C09A51]/10' : 'border-[#3F2F23] hover:border-[#5a4030]'
                        }`}
                      >
                        {cfg.badge && (
                          <span className="absolute -top-2.5 right-4 text-[10px] bg-[#8B0000] text-[#C09A51] px-2 py-0.5 rounded-full font-bold">
                            {cfg.badge}
                          </span>
                        )}
                        <div>
                          <p className={`font-black uppercase text-sm ${active ? 'text-[#C09A51]' : 'text-gray-300'}`}>{cfg.label}</p>
                          <p className="text-gray-500 text-xs">{cfg.days} días de acceso</p>
                        </div>
                        <p className={`font-black text-2xl ${active ? 'text-[#C09A51]' : 'text-gray-400'}`}>
                          {p} <span className="text-sm">{selectedOption.currency}</span>
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">2 — Red y Moneda</p>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedOption(opt)}
                      className={`p-3 rounded-lg border transition-all text-left ${
                        selectedOption.id === opt.id
                          ? 'border-[#C09A51] bg-[#C09A51]/10'
                          : 'border-[#3F2F23] hover:border-[#5a4030]'
                      }`}
                    >
                      <p className="text-white font-bold text-xs">{opt.currency}</p>
                      <p className="text-gray-500 text-[10px]">Red {opt.network}</p>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full py-4 bg-[#8B0000] text-[#C09A51] font-black uppercase text-sm rounded-xl hover:bg-[#a00000] transition-all border border-[#C09A51]/30"
              >
                Continuar → Ver Dirección de Pago
              </button>
            </div>
          )}

          {/* Step 2: TX Hash */}
          {step === 2 && (
            <div className="p-6 md:p-10 space-y-6">
              <div className="bg-black/40 rounded-xl p-4 border border-[#3F2F23] flex justify-between items-center">
                <div>
                  <p className="text-gray-500 text-[10px] uppercase">Plan</p>
                  <p className="text-[#C09A51] font-black text-lg uppercase">{planConfig.label}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 text-[10px] uppercase">Monto exacto</p>
                  <p className="text-white font-black text-2xl">{price} {selectedOption.currency}</p>
                  <p className="text-gray-500 text-[10px]">Red {selectedOption.network}</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">
                  Dirección de pago
                </p>
                <div className="bg-black/60 border border-[#3F2F23] rounded-xl p-4 flex items-center gap-3">
                  <p className="font-mono text-xs text-gray-300 flex-1 break-all">{selectedOption.address}</p>
                  <button
                    onClick={handleCopy}
                    className={`shrink-0 px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
                      copied
                        ? 'bg-green-900/30 border-green-500 text-green-400'
                        : 'bg-[#8B0000]/30 border-[#8B0000] text-[#C09A51] hover:bg-[#8B0000]/50'
                    }`}
                  >
                    {copied ? '✓ Copiado' : 'Copiar'}
                  </button>
                </div>
                <div className="flex justify-center mt-4 p-4 bg-white rounded-xl w-fit mx-auto">
                  <QRCode value={selectedOption.address} size={160} />
                </div>
              </div>

              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">TX Hash de tu transacción</p>
                <input
                  type="text"
                  placeholder="0x1a2b3c4d..."
                  value={txHash}
                  onChange={e => setTxHash(e.target.value.trim())}
                  className={`albion-input font-mono text-xs rounded-xl transition-all ${
                    txHash.length > 0
                      ? txHashValid ? 'border-green-500' : 'border-red-600'
                      : ''
                  }`}
                />
                {txHash.length > 0 && (
                  <p className={`text-[10px] mt-1 ${txHashValid ? 'text-green-400' : 'text-red-400'}`}>
                    {txHashValid
                      ? '✓ Formato válido'
                      : `✗ Debe ser 0x + 64 hex (tienes ${txHash.length} chars)`}
                  </p>
                )}
              </div>

              {message && (
                <div className={`p-4 rounded-xl text-sm font-medium text-center ${
                  message.type === 'success'
                    ? 'bg-green-900/30 border border-green-500 text-green-400'
                    : 'bg-red-900/30 border border-red-800 text-red-400'
                }`}>
                  {message.text}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border border-[#3F2F23] text-gray-400 rounded-xl hover:border-[#5a4030] transition-all text-sm font-bold"
                >
                  ← Volver
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!txHashValid || submitting}
                  className="flex-[2] py-4 bg-[#8B0000] text-[#C09A51] font-black uppercase text-sm rounded-xl hover:bg-[#a00000] transition-all border border-[#C09A51]/30 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Enviando...' : '✓ Confirmar Pago'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmación */}
          {step === 3 && (
            <div className="p-10 flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-green-900/30 border-2 border-green-500 flex items-center justify-center">
                <span className="text-4xl">✓</span>
              </div>
              <div>
                <h2 className="text-[#C09A51] font-black text-2xl uppercase">¡TX Recibido!</h2>
                <p className="text-gray-400 text-sm mt-2 max-w-sm">
                  Tu transacción fue enviada para verificación. Recibirás un email cuando esté activa.
                </p>
              </div>
              <div className="bg-black/40 border border-[#3F2F23] rounded-xl p-4 w-full text-left">
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">TX Hash enviado</p>
                <p className="font-mono text-xs text-gray-300 break-all">{txHash}</p>
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full py-4 bg-[#8B0000] text-[#C09A51] font-black uppercase text-sm rounded-xl hover:bg-[#a00000] transition-all border border-[#C09A51]/30"
              >
                Ir a Mi Panel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
