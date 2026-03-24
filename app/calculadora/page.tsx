'use client'
import { useState } from 'react'

export default function CalculadoraAlbion() {
  const [tab, setTab] = useState('refinado')

  return (
    <div className="min-h-screen w-full flex flex-col items-center p-2 md:p-8">
      {/* Header Responsivo */}
      <header className="w-full max-w-5xl mb-6 text-center">
        <h1 className="text-2xl md:text-4xl font-bold text-[#C09A51] uppercase tracking-tighter">
          ALBION CRAFTER HUB
        </h1>
        <div className="h-1 w-20 bg-[#8B0000] mx-auto mt-2"></div>
      </header>

      <div className="w-full max-w-5xl albion-panel overflow-hidden">
        {/* Navegación por Pestañas (Se adapta a móvil con scroll lateral si es necesario) */}
        <nav className="flex overflow-x-auto border-b border-[#3F2F23] bg-black/20 no-scrollbar">
          {['refinado', 'comida', 'pociones'].map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`flex-1 min-w-[110px] py-4 px-2 text-[10px] md:text-sm font-bold uppercase transition-all
                ${tab === item ? 'bg-[#8B0000] text-[#C09A51] border-t-2 border-[#C09A51]' : 'text-gray-500 hover:text-white'}`}
            >
              {item}
            </button>
          ))}
        </nav>

        {/* Contenido dinámico según la pestaña seleccionada */}
        <main className="p-4 md:p-8">
          {tab === 'refinado' && <RefinadoTab />}
          {tab === 'comida' && <SeccionProximamente titulo="Cocina de Gremio" />}
          {tab === 'pociones' && <SeccionProximamente titulo="Laboratorio de Alquimia" />}
        </main>
      </div>
    </div>
  )
}

function RefinadoTab() {
  const [precio, setPrecio] = useState(0)
  const [rrr, setRrr] = useState(36.7)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in">
      <div className="space-y-4">
        <h2 className="text-[#C09A51] font-bold uppercase italic border-l-4 border-[#8B0000] pl-3">Refinado de Materiales</h2>
        <div>
          <label className="text-[10px] text-gray-400 block mb-1 uppercase font-bold">Precio Recurso Raw (Bruto)</label>
          <input 
            type="number" 
            placeholder="Ej: 450" 
            className="albion-input" 
            onChange={(e) => setPrecio(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="text-[10px] text-gray-400 block mb-1 uppercase font-bold">Tasa de Retorno (RRR)</label>
          <select className="albion-input" onChange={(e) => setRrr(Number(e.target.value))}>
            <option value="36.7">36.7% (Ciudad + Foco)</option>
            <option value="15.2">15.2% (Sin Foco)</option>
            <option value="53.9">53.9% (Evento + Foco)</option>
          </select>
        </div>
      </div>
      
      {/* Visualización de resultado estilo Albion */}
      <div className="bg-black/30 border border-[#3F2F23] rounded p-6 flex flex-col justify-center items-center text-center">
        <span className="text-[#C09A51] text-xs font-bold mb-4 tracking-widest uppercase">Costo Estimado Producción</span>
        <div className="text-5xl md:text-7xl font-bold text-white tracking-tighter">
          {Math.floor(precio * (1 - rrr / 100)).toLocaleString()}
        </div>
        <span className="text-gray-500 text-[10px] mt-2 uppercase">Silver por unidad final</span>
      </div>
    </div>
  )
}

function SeccionProximamente({ titulo }: { titulo: string }) {
  return (
    <div className="py-20 text-center">
      <h2 className="text-[#C09A51] text-2xl font-bold uppercase mb-4">{titulo}</h2>
      <p className="text-gray-500 italic">Prepara tus ingredientes... Próximamente habilitaremos esta sección.</p>
    </div>
  )
}
