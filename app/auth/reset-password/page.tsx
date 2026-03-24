'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function ResetForm() {
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const router = useRouter()

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    })
    
    if (res.ok) {
      setMessage('¡Contraseña cambiada! Redirigiendo al login...')
      setTimeout(() => router.push('/login'), 2500)
    } else {
      setMessage('Error: El enlace ha expirado o es inválido.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1025] text-white p-4">
      <form onSubmit={handleSubmit} className="p-8 bg-[#2d1b4d] rounded-2xl shadow-xl w-full max-w-md border border-purple-900 text-center">
        <h1 className="text-2xl font-bold mb-4 text-purple-400">Nueva Contraseña</h1>
        <p className="text-gray-400 text-sm mb-6">Ingresa tu nueva clave para acceder a la calculadora.</p>
        <input 
          type="password" 
          placeholder="Escribe tu nueva clave" 
          className="w-full p-3 rounded-lg bg-[#3d2566] border border-purple-500 mb-4 outline-none focus:ring-2 ring-purple-400" 
          onChange={(e) => setPassword(e.target.value)} 
          required 
        />
        <button className="w-full bg-purple-600 hover:bg-purple-700 p-3 rounded-lg font-bold transition">
          Actualizar contraseña
        </button>
        {message && <p className="mt-4 text-purple-300 bg-purple-900/30 p-2 rounded-lg text-sm">{message}</p>}
      </form>
    </div>
  )
}

export default function ResetPassword() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#1a1025] text-white">Cargando...</div>}>
      <ResetForm />
    </Suspense>
  )
}
