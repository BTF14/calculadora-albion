'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.toLowerCase().trim() }),
      })

      if (res.ok || res.status === 404) {
        // Siempre mostramos éxito (anti-enum de emails)
        setSent(true)
      } else if (res.status === 429) {
        setError('Demasiados intentos. Espera unos minutos.')
      } else {
        setError('Error al enviar. Intenta de nuevo.')
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">

        {/* Logo */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-[#C09A51] uppercase italic tracking-tighter">
            Albion Hub
          </h1>
          <div className="h-0.5 w-16 bg-[#8B0000] mx-auto" />
        </div>

        {sent ? (
          /* Estado: Email enviado */
          <div className="albion-panel rounded-2xl p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-green-900/30 border-2 border-green-500 flex items-center justify-center mx-auto">
              <span className="text-3xl">✉️</span>
            </div>
            <div>
              <h2 className="text-[#C09A51] font-black text-lg uppercase">¡Revisa tu email!</h2>
              <p className="text-gray-400 text-sm mt-2">
                Si <strong className="text-white">{email}</strong> tiene una cuenta,
                recibirás un enlace de recuperación en los próximos minutos.
              </p>
              <p className="text-gray-600 text-xs mt-3">El enlace expira en 1 hora.</p>
            </div>
            <Link
              href="/login"
              className="block w-full py-3 text-center bg-[#8B0000] text-[#C09A51] font-black uppercase text-xs rounded-xl border border-[#C09A51]/30 hover:bg-[#a00000] transition-all"
            >
              Volver al Login
            </Link>
          </div>
        ) : (
          /* Formulario */
          <div className="albion-panel rounded-2xl p-8 space-y-5">
            <div>
              <h2 className="text-[#C09A51] font-black text-sm uppercase tracking-widest border-l-4 border-[#8B0000] pl-3">
                Recuperar Acceso
              </h2>
              <p className="text-gray-500 text-xs mt-2 pl-4">
                Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
              </p>
            </div>

            <div>
              <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1.5">
                Email de tu cuenta
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@gmail.com"
                required
                className="albion-input rounded-xl"
                onKeyDown={e => e.key === 'Enter' && handleSubmit(e)}
              />
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-800 rounded-xl p-3 text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || !email}
              className="w-full py-4 bg-[#8B0000] text-[#C09A51] font-black uppercase text-sm rounded-xl hover:bg-[#a00000] transition-all border border-[#C09A51]/30 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Enviando...' : '🔑 Enviar Enlace de Recuperación'}
            </button>

            <p className="text-center text-gray-500 text-sm">
              ¿Recordaste tu clave?{' '}
              <Link href="/login" className="text-[#C09A51] hover:text-white transition-colors font-bold">
                Iniciar sesión
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
