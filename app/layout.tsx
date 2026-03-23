import '../styles/globals.css'
import { inter } from 'next/font/google'
import { Providers } from './providers'

const inter = inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Albion Crafting Calculator',
  description: 'Calculadora de crafteo para Albion Online',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Providers>
          <main className="container mx-auto p-4">{children}</main>
        </Providers>
      </body>
    </html>
  )
}
