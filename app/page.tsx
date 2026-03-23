import Link from 'next/link'

export default function Home() {
  return (
    <div className="text-center mt-10">
      <h1 className="text-3xl font-bold mb-4">Albion Crafting Calculator</h1>
      <p className="mb-6">Calcula refinado, transmutación, pociones y más con datos reales del juego.</p>
      <Link href="/calculadora" className="bg-blue-600 text-white px-6 py-3 rounded-lg">
        Comenzar
      </Link>
    </div>
  )
}
