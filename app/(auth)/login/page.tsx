'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [showPass, setShowPass] = useState(false)
  const [justRegistered, setJustRegistered] = useState(false)

  useEffect(() => {
    if (searchParams.get('registered') === 'true') setJustRegistered(true)
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email:    email.toLowerCase().trim(),
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Email o contraseña incorrectos.')
      } else {
        router.push('/dashboard')
        router.refresh()
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

        {/* Logo / Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-[#C09A51] uppercase italic tracking-tighter">
            Albion Hub
          </h1>
          <div className="h-0.5 w-16 bg-[#8B0000] mx-auto" />
          <p className="text-gray-400 text-sm">Calculadora profesional de crafteo</p>
        </div>

        {/* Registro exitoso */}
        {justRegistered && (
          <div className="bg-green-900/30 border border-green-600 rounded-xl p-4 text-center">
            <p className="text-green-400 font-bold text-sm">¡Cuenta creada! Tienes 24h de acceso gratis.</p>
          </div>
        )}

        {/* Card */}
        <div className="albion-panel rounded-2xl p-8 space-y-5">
          <h2 className="text-[#C09A51] font-black text-sm uppercase tracking-widest border-l-4 border-[#8B0000] pl-3">
            Iniciar Sesión
          </h2>

          <div className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@gmail.com"
                required
                autoComplete="email"
                className="albion-input rounded-xl"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[10px] text-gray-400 font-bold uppercase">
                  Contraseña
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-[10px] text-gray-500 hover:text-[#C09A51] transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Tu contraseña"
                  required
                  autoComplete="current-password"
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
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-900/30 border border-red-800 rounded-xl p-3 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading || !email || !password}
            className="w-full py-4 bg-[#8B0000] text-[#C09A51] font-black uppercase text-sm rounded-xl hover:bg-[#a00000] transition-all border border-[#C09A51]/30 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Ingresando...' : '⚔ Ingresar'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#3F2F23]" />
            <span className="text-gray-600 text-xs">o</span>
            <div className="flex-1 h-px bg-[#3F2F23]" />
          </div>

          <p className="text-center text-gray-500 text-sm">
            ¿No tienes cuenta?{' '}
            <Link href="/registro" className="text-[#C09A51] hover:text-white transition-colors font-bold">
              Regístrate gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
