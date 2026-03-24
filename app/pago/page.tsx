'use client'

import { useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import QRCode from 'qrcode.react'

const PAYMENT_OPTIONS = [
  { id: 'usdt-bep20', network: 'BEP20', asset: 'Tether USD (USDT)', address: '0x08C7661bb9509b858A6AbD6fa28878BdaA55dc9f' },
  { id: 'usdc-base', network: 'BASE', asset: 'USD Coin (USDC)', address: '0x08C7661bb9509b858A6AbD6fa28878BdaA55dc9f' },
  { id: 'usdt-base', network: 'BASE', asset: 'Bridged Tether USD (USDT)', address: '0x08C7661bb9509b858A6AbD6fa28878BdaA55dc9f' },
  { id: 'usdc-bep20', network: 'BEP20', asset: 'BNB pegged USD Coin (USDC)', address: '0x08C7661bb9509b858A6AbD6fa28878BdaA55dc9f' },
]

type Plan = 'weekly' | 'monthly' | 'yearly'

export default function PagoPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [selectedOption, setSelectedOption] = useState(PAYMENT_OPTIONS[0])
  const [selectedPlan, setSelectedPlan] = useState<Plan>('monthly')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  // Lógica para determinar si usamos USDT o USDC basado en la selección
  const isUSDC = selectedOption.asset.includes('USDC');
  const currencyLabel = isUSDC ? 'USDC' : 'USDT';

  // Obtenemos los precios dinámicamente de las variables de entorno
  const prices = useMemo(() => {
    if (isUSDC) {
      return {
        weekly: process.env.NEXT_PUBLIC_WEEKLY_PRICE_USDC || '3 USDC',
        monthly: process.env.NEXT_PUBLIC_MONTHLY_PRICE_USDC || '10 USDC',
        yearly: process.env.NEXT_PUBLIC_YEARLY_PRICE_USDC || '100 USDC',
      };
    }
    return {
      weekly: process.env.NEXT_PUBLIC_WEEKLY_PRICE || '3 USDT',
      monthly: process.env.NEXT_PUBLIC_MONTHLY_PRICE || '10 USDT',
      yearly: process.env.NEXT_PUBLIC_YEARLY_PRICE || '100 USDT',
    };
  }, [isUSDC]);

  if (status === 'loading') return <div className="text-center mt-20">Cargando...</div>
  if (!session) {
    router.push('/login')
    return null
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedOption.address)
    alert('Dirección copiada al portapapeles')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setMessage('Por favor, selecciona una captura de pantalla.')
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('screenshot', file)
    formData.append('plan', selectedPlan)
    formData.append('currency', currencyLabel)

    try {
      const res = await fetch('/api/payment/submit', { method: 'POST', body: formData })
      if (res.ok) {
        setMessage('¡Captura enviada con éxito! Revisaremos tu pago pronto.')
        setFile(null)
      } else {
        const data = await res.json()
        setMessage(data.error || 'Hubo un error al enviar.')
      }
    } catch (err) {
      setMessage('Error de conexión.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-white shadow-xl rounded-2xl text-black">
      <h1 className="text-2xl font-bold mb-6 text-center text-purple-800">Finalizar Suscripción</h1>
      
      {/* Selector de Red y Moneda */}
      <div className="mb-6">
        <label className="block font-semibold mb-2 text-gray-700">1. Selecciona tu método de pago:</label>
        <select
          value={selectedOption.id}
          onChange={e => setSelectedOption(PAYMENT_OPTIONS.find(o => o.id === e.target.value)!)}
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-purple-500 outline-none transition-all"
        >
          {PAYMENT_OPTIONS.map(opt => (
            <option key={opt.id} value={opt.id}>
              {opt.asset} - Red {opt.network}
            </option>
          ))}
        </select>
      </div>

      {/* Selección de Plan */}
      <div className="mb-8">
        <label className="block font-semibold mb-3 text-gray-700">2. Elige tu plan:</label>
        <div className="grid gap-3">
          {(['weekly', 'monthly', 'yearly'] as Plan[]).map((plan) => (
            <label 
              key={plan}
              className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                selectedPlan === plan ? 'border-purple-600 bg-purple-50' : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <input
                type="radio"
                name="plan"
                value={plan}
                checked={selectedPlan === plan}
                onChange={() => setSelectedPlan(plan)}
                className="w-5 h-5 text-purple-600 mr-4"
              />
              <span className="flex-1 font-medium capitalize">
                {plan === 'weekly' ? 'Semanal' : plan === 'monthly' ? 'Mensual' : 'Anual'}
              </span>
              <span className="font-bold text-purple-700">{prices[plan]}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Área de Pago Dinámica */}
      <div className="bg-gray-50 p-6 rounded-2xl mb-8 border border-gray-100">
        <div className="text-center mb-4">
          <p className="text-sm text-gray-500 uppercase tracking-wider font-bold">Monto Exacto a Enviar</p>
          <p className="text-3xl font-black text-purple-900">{prices[selectedPlan]}</p>
        </div>
        
        <div className="bg-white p-3 rounded-lg break-all font-mono text-xs text-center border mb-4">
          {selectedOption.address}
        </div>

        <button 
          onClick={handleCopy}
          className="w-full py-2 text-sm font-bold text-purple-600 hover:bg-purple-100 rounded-lg transition-colors mb-6"
        >
          Copiar Dirección de Billetera
        </button>

        <div className="flex justify-center p-4 bg-white rounded-xl shadow-inner">
          <QRCode value={selectedOption.address} size={180} />
        </div>
      </div>

      {/* Formulario de Envío */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <label className="block text-sm font-bold text-gray-600 mb-1">Sube tu comprobante:</label>
          <input
            type="file"
            accept="image/*"
            onChange={e => setFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl shadow-lg transform active:scale-95 transition-all disabled:opacity-50"
        >
          {uploading ? 'Procesando Envío...' : 'Confirmar y Enviar Pago'}
        </button>
      </form>

      {message && (
        <div className={`mt-6 p-4 rounded-xl text-center font-medium ${message.includes('éxito') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}
    </div>
  )
}
