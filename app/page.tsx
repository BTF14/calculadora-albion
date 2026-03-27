import Link from 'next/link'

const FEATURES = [
  { icon: '⚒️', title: 'Refinado',       desc: 'Calcula costos de T2–T8 con RRR, foco y bonus de ciudad' },
  { icon: '🍖', title: 'Comida',          desc: 'Recetas completas con cantidades por lote ajustable' },
  { icon: '🧪', title: 'Pociones',        desc: 'Ingredientes precisos para pociones y sus variantes .1/.2/.3' },
  { icon: '🎒', title: 'Bags & Equipos',  desc: 'Crafteo de bolsas y equipamiento con todos los encantamientos' },
  { icon: '🔄', title: 'Transmutación',   desc: 'Costos de tier-up y enchant-up de recursos' },
  { icon: '🎯', title: 'Favoritos',       desc: 'Guarda tus recetas más usadas con precios personalizados' },
]

const PLANS = [
  { name: 'Semanal',  price: '$3',   period: '/ semana', days: '7 días',   highlight: false },
  { name: 'Mensual',  price: '$10',  period: '/ mes',    days: '30 días',  highlight: true, badge: '🔥 Popular' },
  { name: 'Anual',    price: '$100', period: '/ año',    days: '365 días', highlight: false, badge: '💎 Mejor Valor' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen">

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-[#3F2F23]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-[#C09A51] font-black text-xl uppercase italic tracking-tighter">
            Albion Hub
          </span>
          <div className="flex gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-gray-400 hover:text-white text-sm font-bold transition-colors"
            >
              Ingresar
            </Link>
            <Link
              href="/registro"
              className="px-4 py-2 bg-[#8B0000] text-[#C09A51] text-sm font-black rounded-lg border border-[#C09A51]/30 hover:bg-[#a00000] transition-all uppercase"
            >
              Gratis 24h
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-block bg-[#8B0000]/30 border border-[#8B0000] text-[#C09A51] text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest">
            ⚔ Herramienta #1 para crafters en español
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-[#C09A51] uppercase italic tracking-tighter leading-none">
            Maximiza tu profit<br />
            <span className="text-white">en Albion Online</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Calculadora profesional de refinado, comida, pociones y crafteo con datos reales del mercado.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/registro"
              className="px-8 py-4 bg-[#8B0000] text-[#C09A51] font-black uppercase text-sm rounded-xl border border-[#C09A51]/30 hover:bg-[#a00000] transition-all"
            >
              Probar Gratis — 24 Horas
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 bg-transparent text-gray-300 font-bold text-sm rounded-xl border border-[#3F2F23] hover:border-[#C09A51] transition-all"
            >
              Ya tengo cuenta
            </Link>
          </div>
          <p className="text-gray-600 text-xs">Sin tarjeta de crédito · Solo USDT/USDC · Cancela cuando quieras</p>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-16 px-4 bg-black/20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-[#C09A51] font-black text-2xl uppercase italic tracking-tighter mb-12">
            Todo lo que necesitas para craftear
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(f => (
              <div
                key={f.title}
                className="albion-panel rounded-xl p-6 space-y-3 hover:border-[#C09A51]/50 border-2 border-transparent transition-all group"
              >
                <span className="text-3xl">{f.icon}</span>
                <h3 className="text-[#C09A51] font-black uppercase text-sm group-hover:text-white transition-colors">
                  {f.title}
                </h3>
                <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REFERIDOS ── */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto albion-panel rounded-2xl p-8 md:p-12 text-center space-y-6">
          <h2 className="text-[#C09A51] font-black text-2xl uppercase italic tracking-tighter">
            🎁 Invita y Gana Días Gratis
          </h2>
          <p className="text-gray-400 text-sm max-w-lg mx-auto">
            Por cada jugador que se suscriba usando tu link de referido, ganas{' '}
            <strong className="text-[#C09A51]">7 días de acceso premium completamente gratis</strong>.
            Sin límite — cuantos más invites, más días acumulas.
          </p>
          <div className="grid grid-cols-3 gap-4 py-4">
            {[
              { n: '1', label: 'referido', days: '7 días gratis' },
              { n: '5', label: 'referidos', days: '35 días gratis' },
              { n: '10', label: 'referidos', days: '70 días gratis' },
            ].map(r => (
              <div key={r.n} className="bg-black/40 rounded-xl p-4">
                <p className="text-3xl font-black text-[#C09A51]">{r.n}</p>
                <p className="text-gray-500 text-[10px] uppercase">{r.label}</p>
                <p className="text-white text-xs font-bold mt-1">{r.days}</p>
              </div>
            ))}
          </div>
          <Link
            href="/registro"
            className="inline-block px-8 py-4 bg-[#8B0000] text-[#C09A51] font-black uppercase text-sm rounded-xl border border-[#C09A51]/30 hover:bg-[#a00000] transition-all"
          >
            Crear Cuenta y Obtener Mi Código
          </Link>
        </div>
      </section>

      {/* ── PRECIOS ── */}
      <section className="py-16 px-4 bg-black/20">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-center text-[#C09A51] font-black text-2xl uppercase italic tracking-tighter">
            Planes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map(p => (
              <div
                key={p.name}
                className={`relative rounded-2xl p-6 text-center space-y-4 border-2 transition-all ${
                  p.highlight
                    ? 'border-[#C09A51] bg-[#C09A51]/5'
                    : 'border-[#3F2F23] bg-[#2A1F16]'
                }`}
              >
                {p.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] bg-[#8B0000] text-[#C09A51] px-3 py-1 rounded-full font-bold whitespace-nowrap">
                    {p.badge}
                  </span>
                )}
                <h3 className={`font-black uppercase text-sm ${p.highlight ? 'text-[#C09A51]' : 'text-gray-300'}`}>
                  {p.name}
                </h3>
                <div>
                  <span className="text-4xl font-black text-white">{p.price}</span>
                  <span className="text-gray-500 text-sm ml-1">{p.period}</span>
                </div>
                <p className="text-gray-500 text-xs">{p.days} de acceso completo</p>
                <Link
                  href="/registro"
                  className={`block py-2.5 rounded-xl text-xs font-black uppercase transition-all ${
                    p.highlight
                      ? 'bg-[#8B0000] text-[#C09A51] border border-[#C09A51]/30 hover:bg-[#a00000]'
                      : 'bg-black/40 text-gray-300 border border-[#3F2F23] hover:border-[#C09A51]'
                  }`}
                >
                  Empezar
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-600 text-xs">
            Pagos en USDT / USDC · Redes BEP20 y BASE · Verificación manual en {'<'} 24h
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-8 px-4 border-t border-[#3F2F23] text-center">
        <p className="text-gray-600 text-xs">
          © {new Date().getFullYear()} Albion Hub — No afiliado con Sandbox Interactive GmbH
        </p>
      </footer>

    </div>
  )
}
