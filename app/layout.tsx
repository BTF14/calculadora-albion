import '../styles/globals.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Albion Crafter Hub',
  description: 'Calculadora profesional de crafteo para el Gremio',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        {/* Esto es vital para que se vea bien en tu teléfono y no se mueva el zoom */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </head>
      <body className={inter.className}>
        <Providers>
          {/* Eliminamos el 'container mx-auto' para que el diseño ocupe todo el ancho real */}
          {children}
        </Providers>
      </body>
    </html>
  )
}
