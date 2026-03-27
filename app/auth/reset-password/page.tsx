'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ResetForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const token        = searchParams.get('token')

  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [loading, setLoading]     = useState(false)
  const [success, setSuccess]     = useState(false)
  const [error, setError]         = useState('')
  const [showPass, setShowPass]   = useState(false)

  // Token inválido desde URL
  if (!token) {
    return (
      <div className="albion-panel rounded-2xl p-8 text-center space-y-4">
        <p className="text-4xl">⚠️</p>
        <h2 className="text-red-400 font-black uppercase">Enlace inválido</h2>
        <p className="text-gray-500 text-sm">El enlace de recuperación es inválido o ha expirado.</p>
        <Link
          href="/auth/forgot-password"
          className="block py-3 bg-[#8B0000] text-[#C09A51] font-black uppercase text-xs rounded-xl border border-[#C09A51]/30 hover:bg-[#a00000] transition-all"
        >
          Solicitar Nuevo Enlace
        </Link>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => router.push('/login'), 3000)
      } else if (res.status === 429) {
        setError('Demasiados intentos. Espera unos minutos.')
      } else {
        setError(data.error ?? 'El enlace ha expirado. Solicita uno nuevo.')
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="albion-panel rounded-2xl p-8 text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-green-900/30 border-2 border-green-500 flex items-center justify-center mx-auto">
          <span className="text-3xl">✓</span>
        </div>
        <div>
          <h2 className="text-[#C09A51] font-black text-lg uppercase">¡Contraseña actualizada!</h2>
          <p className="text-gray-400 text-sm mt-2">Redirigiendo al login en 3 segundos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="albion-panel rounded-2xl p-8 space-y-5">
      <div>
        <h2 className="text-[#C09A51] font-black text-sm uppercase tracking-widest border-l-4 border-[#8B0000] pl-3">
          Nueva Contraseña
        </h2>
        <p className="text-gray-500 text-xs mt-2 pl-4">
          Elige una contraseña segura de al menos 8 caracteres.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1.5">
            Nueva contraseña
          </label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="albion-input rounded-xl pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPass(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs"
            >
              {showPass ? 'Ocultar' : 'Ver'}
            </button>
          </div>
          {password.length > 0 && (
            <div className="flex gap-1 mt-1.5">
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className={`flex-1 h-1 rounded-full transition-all ${
                    password.length >= i * 3
                      ? password.length >= 12 ? 'bg-green-500'
                      : password.length >= 8  ? 'bg-[#C09A51]'
                      : 'bg-red-700'
                      : 'bg-[#3F2F23]'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1.5">
            Confirmar contraseña
          </label>
          <input
            type={showPass ? 'text' : 'password'}
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Repite la contraseña"
            className={`albion-input rounded-xl transition-colors ${
              confirm && confirm !== password ? 'border-red-600' :
              confirm && confirm === password ? 'border-green-500' : ''
            }`}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-xl p-3 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || !password || !confirm}
        className="w-full py-4 bg-[#8B0000] text-[#C09A51] font-black uppercase text-sm rounded-xl hover:bg-[#a00000] transition-all border border-[#C09A51]/30 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? 'Guardando...' : '🔑 Actualizar Contraseña'}
      </button>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-[#C09A51] uppercase italic tracking-tighter">
            Albion Hub
          </h1>
          <div className="h-0.5 w-16 bg-[#8B0000] mx-auto" />
        </div>
        <Suspense
          fallback={
            <div className="albion-panel rounded-2xl p-8 text-center">
              <p className="text-[#C09A51] animate-pulse">Cargando...</p>
            </div>
          }
        >
          <ResetForm />
        </Suspense>
      </div>
    </div>
  )
}
