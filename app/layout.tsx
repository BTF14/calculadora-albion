import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import '../styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title:       'Albion Hub — Calculadora de Crafteo',
  description: 'Herramienta profesional de crafteo para Albion Online. Calcula refinado, comida, pociones y más.',
  keywords:    ['albion online', 'calculadora', 'crafteo', 'refinado', 'pociones'],
  robots:      'index, follow',
}

export const viewport: Viewport = {
  width:            'device-width',
  initialScale:     1,
  maximumScale:     1,
  userScalable:     false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
