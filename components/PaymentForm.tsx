'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import QRCode from 'qrcode.react'

const PAYMENT_OPTIONS = [
  { id: 'usdc-base', network: 'BASE', asset: 'USD Coin (USDC)', address: '0x08C7661bb9509b858A6AbD6fa28878BdaA55dc9f' },
  { id: 'usdt-bep20', network: 'BEP20', asset: 'Tether USD (USDT)', address: '0x08C7661bb9509b858A6AbD6fa28878BdaA55dc9f' },
  { id: 'usdt-base', network: 'BASE', asset: 'Bridged Tether USD (USDT)', address: '0x08C7661bb9509b858A6AbD6fa28878BdaA55dc9f' },
  { id: 'usdc-bep20', network: 'BEP20', asset: 'BNB pegged USD Coin (USDC)', address: '0x08C7661bb9509b858A6AbD6fa28878BdaA55dc9f' },
]

type Plan = 'weekly' | 'monthly' | 'yearly'

export default function PaymentForm() {
  const router = useRouter()
  const [selectedOption, setSelectedOption] = useState(PAYMENT_OPTIONS[0])
  const [selectedPlan, setSelectedPlan] = useState<Plan>('monthly')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  const getPlanPrice = () => {
    switch (selectedPlan) {
      case 'weekly': return process.env.NEXT_PUBLIC_WEEKLY_PRICE || '3 USDT'
      case 'monthly': return process.env.NEXT_PUBLIC_MONTHLY_PRICE || '10 USDT'
      case 'yearly': return process.env.NEXT_PUBLIC_YEARLY_PRICE || '100 USDT'
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedOption.address)
    alert('Dirección copiada')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setMessage('Selecciona una captura')
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('screenshot', file)
    formData.append('plan', selectedPlan)

    const res = await fetch('/api/payment/submit', { method: 'POST', body: formData })
    if (res.ok) {
      setMessage('Captura enviada. Recibirás confirmación por correo.')
      setFile(null)
    } else {
      const data = await res.json()
      setMessage(data.error || 'Error al enviar')
    }
    setUploading(false)
  }

  return (
    <div className="max-w-lg mx-auto mt-10 p-4">
      <h1 className="text-2xl font-bold mb-4">Completar pago</h1>
      <div className="mb-6">
        <label className="block font-medium mb-2">Plan:</label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="plan"
              value="weekly"
              checked={selectedPlan === 'weekly'}
              onChange={() => setSelectedPlan('weekly')}
              className="mr-2"
            />
            Semanal – {getPlanPrice()} (7 días)
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="plan"
              value="monthly"
              checked={selectedPlan === 'monthly'}
              onChange={() => setSelectedPlan('monthly')}
              className="mr-2"
            />
            Mensual – {getPlanPrice()} (30 días)
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="plan"
              value="yearly"
              checked={selectedPlan === 'yearly'}
              onChange={() => setSelectedPlan('yearly')}
              className="mr-2"
            />
            Anual – {getPlanPrice()} (365 días)
          </label>
        </div>
      </div>

      <label className="block font-medium mb-2">Red y moneda:</label>
      <select
        value={selectedOption.id}
        onChange={e => setSelectedOption(PAYMENT_OPTIONS.find(o => o.id === e.target.value)!)}
        className="w-full border rounded px-3 py-2 mb-4"
      >
        {PAYMENT_OPTIONS.map(opt => (
          <option key={opt.id} value={opt.id}>
            {opt.asset} ({opt.network})
          </option>
        ))}
      </select>

      <div className="bg-gray-100 p-4 rounded mb-6">
        <p className="font-mono break-all text-sm">{selectedOption.address}</p>
        <button onClick={handleCopy} className="mt-2 text-blue-600 text-sm underline">
          Copiar dirección
        </button>
        <div className="mt-4 flex justify-center">
          <QRCode value={selectedOption.address} size={150} includeMargin />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="file"
          accept="image/png,image/jpeg"
          onChange={e => setFile(e.target.files?.[0] || null)}
          className="w-full border rounded px-3 py-2"
          required
        />
        <button
          type="submit"
          disabled={uploading}
          className="bg-blue-600 text-white px-4 py-2 rounded w-full disabled:opacity-50"
        >
          {uploading ? 'Enviando...' : 'Enviar captura'}
        </button>
      </form>
      {message && <p className="mt-4 text-center text-green-600">{message}</p>}
    </div>
  )
}
