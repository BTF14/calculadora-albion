'use client'
import { useState, useMemo } from 'react'

export default function CalculadoraMasterAlbion() {
  const [tab, setTab] = useState('refinado')

  return (
    <div className="min-h-screen w-full flex flex-col items-center p-2 md:p-8">
      <header className="w-full max-w-6xl mb-6 text-center">
        <h1 className="text-3xl md:text-5xl font-bold text-[#C09A51] tracking-tighter uppercase italic">
          Albion Hub 2026
        </h1>
        <div className="h-1 w-24 bg-[#8B0000] mx-auto mt-2"></div>
      </header>

      <div className="w-full max-w-6xl albion-panel overflow-hidden flex flex-col min-h-[70vh]">
        {/* Navegación Principal */}
        <nav className="flex overflow-x-auto border-b border-[#3F2F23] bg-black/40 no-scrollbar">
          {['refinado', 'comida', 'pociones'].map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`flex-1 min-w-[120px] py-5 px-2 text-xs md:text-sm font-black uppercase transition-all
                ${tab === item ? 'bg-[#8B0000] text-[#C09A51] border-t-4 border-[#C09A51]' : 'text-gray-500 hover:text-gray-200'}`}
            >
              {item === 'refinado' ? '⚒️ Refinado' : item === 'comida' ? '🍖 Comida' : '🧪 Pociones'}
            </button>
          ))}
        </nav>

        <main className="p-4 md:p-10 flex-1 bg-[#1a1410]/50">
          {tab === 'refinado' && <RefinadoModule />}
          {tab === 'comida' && <ComidaModule />}
          {tab === 'pociones' && <PocionesModule />}
        </main>
      </div>
    </div>
  )
}

/* --- MODULO DE REFINADO --- */
function RefinadoModule() {
  const [tier, setTier] = useState(4)
  const [rrr, setRrr] = useState(36.7)
  const [precioRaw, setPrecioRaw] = useState(0)
  const [precioRef, setPrecioRef] = useState(0)

  // Lógica de Tier: T2-T4 usan 2, T5 usa 3, T6 usa 4, T7-T8 usan 5
  const rawNecesario = useMemo(() => {
    if (tier <= 4) return 2;
    if (tier === 5) return 3;
    if (tier === 6) return 4;
    return 5;
  }, [tier]);

  const costoProduccion = Math.floor((precioRaw * rawNecesario) * (1 - rrr / 100));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in duration-500">
      <div className="space-y-6">
        <h2 className="text-[#C09A51] text-xl font-bold uppercase italic border-l-4 border-[#8B0000] pl-4">Calculadora de Refinado</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] text-gray-400 block mb-1 font-bold">TIER DEL RECURSO</label>
            <select className="albion-input" onChange={(e) => setTier(Number(e.target.value))}>
              {[2,3,4,5,6,7,8].map(t => <option key={t} value={t}>Tier {t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-gray-400 block mb-1 font-bold">RETORNO (RRR %)</label>
            <select className="albion-input" onChange={(e) => setRrr(Number(e.target.value))}>
              <option value="36.7">36.7% (Foco)</option>
              <option value="15.2">15.2% (Sin Foco)</option>
              <option value="53.9">53.9% (Evento)</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-[10px] text-gray-400 block mb-1 font-bold uppercase">Precio Material Bruto (Raw)</label>
          <input type="number" className="albion-input text-2xl" placeholder="0" onChange={(e) => setPrecioRaw(Number(e.target.value))} />
        </div>
      </div>

      <div className="bg-black/40 border-2 border-[#3F2F23] rounded-xl p-8 flex flex-col justify-center items-center text-center shadow-2xl">
        <span className="text-[#C09A51] text-xs font-bold mb-2 uppercase tracking-tighter">Costo por Unidad Refinada</span>
        <div className="text-6xl md:text-7xl font-black text-white">{costoProduccion.toLocaleString()}</div>
        <div className="mt-4 text-[10px] text-gray-500 italic">
          Requiere {rawNecesario} unidades de Raw T{tier} + 1 Refinado T{tier-1}
        </div>
      </div>
    </div>
  )
}

/* --- MODULO DE COMIDA --- */
function ComidaModule() {
  const [busqueda, setBusqueda] = useState('')
  const [lotes, setLotes] = useState(1)

  const recetasComida = [
    { n: "Sopa de Zanahoria (T3)", i: [{ m: "Zanahoria", c: 16 }] },
    { n: "Pastel de Pollo (T4)", i: [{ m: "Trigo", c: 2 }, { m: "Harina", c: 4 }, { m: "Pollo Crudo", c: 8 }] },
    { n: "Tortilla de Pollo (T4)", i: [{ m: "Trigo", c: 4 }, { m: "Pollo Crudo", c: 8 }, { m: "Huevos", c: 2 }] },
    { n: "Guiso de Cerdo (T8)", i: [{ m: "Cerdo Crudo", c: 72 }, { m: "Maíz", c: 36 }, { m: "Leche Oveja", c: 18 }] },
    { n: "Tortilla de Cerdo (T8)", i: [{ m: "Maíz", c: 36 }, { m: "Huevos Ganso", c: 18 }, { m: "Cerdo Crudo", c: 72 }] },
    { n: "Guiso de Ternera (T8)", i: [{ m: "Ternera Cruda", c: 72 }, { m: "Calabaza", c: 36 }, { m: "Pan", c: 36 }] },
  ]

  const filtradas = recetasComida.filter(r => r.n.toLowerCase().includes(busqueda.toLowerCase()))

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row gap-4">
        <input 
          type="text" 
          placeholder="🔍 Buscar receta..." 
          className="albion-input flex-1"
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <div className="flex items-center gap-2 bg-black/20 p-2 rounded">
          <span className="text-[10px] text-gray-400 uppercase font-bold px-2">Lotes (x10):</span>
          <input 
            type="number" 
            className="albion-input w-20 text-center" 
            value={lotes} 
            onChange={(e) => setLotes(Math.max(1, Number(e.target.value)))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtradas.map((r, i) => (
          <div key={i} className="bg-[#2a1f16] border border-[#3F2F23] p-5 rounded-lg hover:border-[#C09A51] transition-all group">
            <h3 className="text-[#C09A51] font-black text-sm uppercase mb-3 group-hover:text-white">{r.n}</h3>
            <div className="space-y-1">
              {r.i.map((ing, idx) => (
                <div key={idx} className="flex justify-between text-[11px] border-b border-white/5 pb-1">
                  <span className="text-gray-400">{ing.m}</span>
                  <span className="text-white font-mono">x{ing.c * lotes}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* --- MODULO DE POCIONES --- */
function PocionesModule() {
  const recetasPociones = [
    { n: "Curación Mayor (T6)", i: [{ m: "Dedalera", c: 72 }, { m: "Huevos Ganso", c: 18 }, { m: "Schnapps", c: 18 }] },
    { n: "Veneno Mayor (T8)", i: [{ m: "Milenrama Ghoul", c: 72 }, { m: "Mullein", c: 36 }, { m: "Dragón Teasel", c: 36 }, { m: "Leche Vaca", c: 18 }] },
    { n: "Resistencia Mayor (T7)", i: [{ m: "Mullein", c: 72 }, { m: "Dedalera", c: 36 }, { m: "Bardana", c: 36 }, { m: "Orujo Maíz", c: 18 }] },
    { n: "Invisibilidad (T8)", i: [{ m: "Milenrama Ghoul", c: 72 }, { m: "Dedalera", c: 36 }, { m: "Dragón Teasel", c: 36 }] },
  ]

  return (
    <div className="space-y-6 animate-in zoom-in-95 duration-500">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recetasPociones.map((p, i) => (
          <div key={i} className="bg-black/30 border-l-4 border-[#8B0000] p-5 rounded shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-white font-bold uppercase text-sm">{p.n}</h3>
              <span className="text-[9px] bg-[#C09A51]/20 text-[#C09A51] px-2 py-0.5 rounded">Rinde 5</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {p.i.map((ing, idx) => (
                <div key={idx} className="flex flex-col">
                  <span className="text-[9px] text-gray-500 uppercase">{ing.m}</span>
                  <span className="text-[#C09A51] font-bold">x{ing.c}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="text-center p-6 border-2 border-dashed border-[#3F2F23] rounded-lg">
        <p className="text-gray-500 text-xs italic">Para pociones .1, .2 o .3, recuerda sumar los Extractos de Arcano correspondientes (15 a 45 unidades).</p>
      </div>
    </div>
  )
}
