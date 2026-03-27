'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

// Fix #11: auto-formatea el código referido al escribir (inserta guión tras 2 chars)
function formatReferralCode(raw: string): string {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (clean.length <= 2) return clean
  return `${clean.slice(0, 2)}-${clean.slice(2, 6)}`
}

export default function RegistroPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [refCode, setRefCode]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [showPass, setShowPass] = useState(false)

  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) setRefCode(formatReferralCode(ref))
  }, [searchParams])

  // Fix #11: formatea mientras escribe
  const handleRefCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRefCode(formatReferralCode(e.target.value))
  }

  // Validación del código: debe tener formato XX-XXXX completo o estar vacío
  const refCodeValid  = refCode === '' || /^[A-Z0-9]{2}-[A-Z0-9]{4}$/.test(refCode)
  const refCodeFilled = /^[A-Z0-9]{2}-[A-Z0-9]{4}$/.test(refCode)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return }
    if (password.length < 8)  { setError('La contraseña debe tener al menos 8 caracteres.'); return }
    if (refCode && !refCodeFilled) { setError('El código de referido debe tener el formato: AB-1234'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          email,
          password,
          referral_code: refCodeFilled ? refCode : undefined,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        router.push('/login?registered=true')
      } else {
        setError(data.error ?? 'Error al registrarse.')
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

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-[#C09A51] uppercase italic tracking-tighter">
            Albion Hub
          </h1>
          <div className="h-0.5 w-16 bg-[#8B0000] mx-auto" />
          <p className="text-gray-400 text-sm">Crea tu cuenta — 24h de acceso gratis</p>
        </div>

        <div className="albion-panel rounded-2xl p-8 space-y-5">
          <h2 className="text-[#C09A51] font-black text-sm uppercase tracking-widest border-l-4 border-[#8B0000] pl-3">
            Crear Cuenta
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@gmail.com"
                required
                className="albion-input rounded-xl"
              />
            </div>

            <div>
              <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
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

            <div>
              <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1.5">Confirmar Contraseña</label>
              <input
                type={showPass ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repite la contraseña"
                required
                className={`albion-input rounded-xl transition-colors ${
                  confirm && confirm !== password ? 'border-red-600' :
                  confirm && confirm === password ? 'border-green-500' : ''
                }`}
              />
            </div>

            {/* Fix #11: input auto-formateado */}
            <div>
              <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1.5">
                Código de Referido
                <span className="text-gray-600 normal-case font-normal ml-1">(opcional)</span>
              </label>
              <input
                type="text"
                value={refCode}
                onChange={handleRefCodeChange}
                placeholder="Ej: ED-X7B9"
                maxLength={7}
                className={`albion-input rounded-xl font-mono transition-colors ${
                  refCode && !refCodeValid  ? 'border-red-600' :
                  refCode &&  refCodeFilled ? 'border-[#C09A51]' : ''
                }`}
              />
              {refCode && !refCodeValid && (
                <p className="text-[10px] text-red-400 mt-1">
                  Formato incompleto — escribe 6 caracteres (ej: AB-1234)
                </p>
              )}
              {refCodeFilled && (
                <p className="text-[10px] text-[#C09A51] mt-1">
                  ✓ Código de referido válido
                </p>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-800 rounded-xl p-3 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !email || !password || !confirm || (!!refCode && !refCodeValid)}
            className="w-full py-4 bg-[#8B0000] text-[#C09A51] font-black uppercase text-sm rounded-xl hover:bg-[#a00000] transition-all border border-[#C09A51]/30 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Creando cuenta...' : '⚔ Crear Cuenta — 24h Gratis'}
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#3F2F23]" />
            <span className="text-gray-600 text-xs">o</span>
            <div className="flex-1 h-px bg-[#3F2F23]" />
          </div>

          <p className="text-center text-gray-500 text-sm">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-[#C09A51] hover:text-white transition-colors font-bold">
              Iniciar sesión
            </Link>
          </p>
        </div>

        <div className="text-center">
          <p className="text-gray-600 text-xs">
            Al registrarte obtienes <strong className="text-[#C09A51]">24 horas de acceso gratuito</strong>.
          </p>
        </div>
      </div>
    </div>
  )
}
