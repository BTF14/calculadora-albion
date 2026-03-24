'use client'
import { useState } from 'react'

export default function CalculadoraRefinado() {
  const [precioRecurso, setPrecioRecurso] = useState(0)
  const [retorno, setRetorno] = useState(36.7) // Retorno base en ciudad con foco

  return (
    <div className="min-h-screen p-4 md:p-10 flex flex-col items-center">
      <div className="w-full max-w-4xl albion-panel p-6 md:p-10">
        <h1 className="text-3xl albion-title text-center mb-2">Taller de Refinado</h1>
        <p className="text-center text-gray-400 text-sm mb-8 italic">Optimiza tus recursos para el Gremio</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Columna de Entradas */}
          <div className="space-y-6">
            <div>
              <label className="block text-albion-gold text-sm font-bold mb-2 uppercase">Precio del Recurso (Raw)</label>
              <input 
                type="number" 
                className="w-full albion-input" 
                placeholder="Ej: 450"
                onChange={(e) => setPrecioRecurso(Number(e.target.value))}
              />
            </div>

            <div>
              <label className="block text-albion-gold text-sm font-bold mb-2 uppercase">% de Retorno (RRR)</label>
              <select 
                className="w-full albion-input"
                onChange={(e) => setRetorno(Number(e.target.value))}
              >
                <option value="15.2">15.2% (Sin Foco / Ciudad No Bonus)</option>
                <option value="36.7">36.7% (Con Foco / Ciudad Bonus)</option>
                <option value="43.5">43.5% (Con Foco / Isla Bonus)</option>
                <option value="53.9">53.9% (Evento de Refinado)</option>
              </select>
            </div>
          </div>

          {/* Columna de Resultados Estilo Albion */}
          <div className="bg-black/40 border border-[#3F2F23] rounded-lg p-6 flex flex-col justify-center items-center">
            <h3 className="text-albion-gold font-bold uppercase mb-4">Costo Estimado</h3>
            <div className="text-5xl font-bold text-white mb-2">
              {Math.floor(precioRecurso * (1 - retorno / 100))}
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-widest">Silver por unidad refinada</p>
            
            <div className="mt-6 w-full border-t border-[#3F2F23] pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Eficiencia:</span>
                <span className="text-green-500">+{retorno}%</span>
              </div>
            </div>
          </div>
        </div>

        <button className="w-full albion-button mt-10 p-4 text-xl">
          Calcular Ganancia Total
        </button>
      </div>
    </div>
  )
}
