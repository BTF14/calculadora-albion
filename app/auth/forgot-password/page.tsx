'use client'
import { useState } from 'react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
    if (res.ok) setMessage('Revisa tu correo. Te enviamos un link de recuperación.')
    else setMessage('Error: El correo no está registrado.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1025] text-white p-4">
      <form onSubmit={handleSubmit} className="p-8 bg-[#2d1b4d] rounded-2xl shadow-xl w-full max-w-md border border-purple-900">
        <h1 className="text-2xl font-bold mb-4 text-center">Recuperar Acceso</h1>
        <input type="email" placeholder="tu-correo@gmail.com" className="w-full p-3 rounded-lg bg-[#3d2566] border border-purple-500 mb-4 outline-none" onChange={(e) => setEmail(e.target.value)} required />
        <button className="w-full bg-purple-600 hover:bg-purple-700 p-3 rounded-lg font-bold">Enviar enlace</button>
        {message && <p className="mt-4 text-center text-purple-300">{message}</p>}
      </form>
    </div>
  )
}
