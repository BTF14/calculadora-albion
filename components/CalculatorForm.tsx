'use client'

import { useState } from 'react'
import { calculateRefining } from '@/lib/calculations/refining'
import type {
  ResourceType,
  Enchantment,
  RefiningOutput,
} from '@/lib/calculations/types'

const RESOURCES: { value: ResourceType; label: string; icon: string }[] = [
  { value: 'metal',   label: 'Metal',   icon: '⚙️' },
  { value: 'wood',    label: 'Madera',  icon: '🪵' },
  { value: 'stone',   label: 'Piedra',  icon: '🪨' },
  { value: 'fiber',   label: 'Fibra',   icon: '🌿' },
  { value: 'leather', label: 'Cuero',   icon: '🦎' },
]

const ENCHANTMENTS: { value: Enchantment; label: string }[] = [
  { value: 0, label: 'Normal (.0)'       },
  { value: 1, label: 'Poco común (.1)'   },
  { value: 2, label: 'Raro (.2)'         },
  { value: 3, label: 'Excepcional (.3)'  },
  { value: 4, label: 'Prístino (.4)'     },
]

type CalcError = { error: string }

export default function CalculatorForm() {
  const [resourceType, setResourceType] = useState<ResourceType>('metal')
  const [tier, setTier]                 = useState<number>(5)
  const [enchantment, setEnchantment]   = useState<Enchantment>(0)
  const [quantity, setQuantity]         = useState<number>(100)
  const [focusUsed, setFocusUsed]       = useState<boolean>(false)
  const [cityBonus, setCityBonus]       = useState<boolean>(true)
  const [premium, setPremium]           = useState<boolean>(true)
  const [result, setResult]             = useState<RefiningOutput | CalcError | null>(null)

  const handleCalculate = () => {
    try {
      const output = calculateRefining({
        resourceType, tier, enchantment,
        quantity, focusUsed, cityBonus, premium,
      })
      setResult(output)
    } catch (err) {
      setResult({ error: (err as Error).message })
    }
  }

  const isError = (r: RefiningOutput | CalcError): r is CalcError => 'error' in r

  return (
    <div className="space-y-6">
      {/* Resource selector */}
      <div>
        <label className="text-[10px] text-gray-400 font-bold uppercase block mb-2">
          Tipo de Recurso
        </label>
        <div className="grid grid-cols-5 gap-2">
          {RESOURCES.map(r => (
            <button
              key={r.value}
              onClick={() => setResourceType(r.value)}
              className={`py-3 rounded-xl border-2 text-center transition-all ${
                resourceType === r.value
                  ? 'border-[#C09A51] bg-[#C09A51]/10 text-[#C09A51]'
                  : 'border-[#3F2F23] text-gray-500 hover:border-[#5a4030]'
              }`}
            >
              <div className="text-xl mb-1">{r.icon}</div>
              <div className="text-[9px] font-bold uppercase">{r.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Tier + Enchantment */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1.5">
            Tier
          </label>
          <select
            value={tier}
            onChange={e => setTier(Number(e.target.value))}
            className="albion-input rounded-xl"
          >
            {[2,3,4,5,6,7,8].map(t => (
              <option key={t} value={t}>Tier {t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1.5">
            Encantamiento
          </label>
          <select
            value={enchantment}
            onChange={e => setEnchantment(Number(e.target.value) as Enchantment)}
            className="albion-input rounded-xl"
          >
            {ENCHANTMENTS.map(e => (
              <option key={e.value} value={e.value}>{e.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Quantity */}
      <div>
        <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1.5">
          Cantidad a Refinar
        </label>
        <input
          type="number"
          value={quantity}
          onChange={e => setQuantity(Math.max(1, Math.min(100_000, Number(e.target.value))))}
          min={1}
          max={100000}
          className="albion-input rounded-xl text-xl font-bold"
        />
      </div>

      {/* Toggles */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: '🎯 Foco',        value: focusUsed, set: setFocusUsed },
          { label: '🏛️ Ciudad',      value: cityBonus, set: setCityBonus },
          { label: '👑 Premium',     value: premium,   set: setPremium   },
        ].map(toggle => (
          <button
            key={toggle.label}
            onClick={() => toggle.set(v => !v)}
            className={`py-3 px-2 rounded-xl border-2 text-xs font-bold uppercase transition-all ${
              toggle.value
                ? 'border-[#C09A51] bg-[#C09A51]/10 text-[#C09A51]'
                : 'border-[#3F2F23] text-gray-600 hover:border-[#5a4030]'
            }`}
          >
            {toggle.label}
            <div className="text-[9px] mt-0.5 font-normal normal-case">
              {toggle.value ? 'Activo' : 'Inactivo'}
            </div>
          </button>
        ))}
      </div>

      {/* Calculate button */}
      <button
        onClick={handleCalculate}
        className="w-full py-4 bg-[#8B0000] text-[#C09A51] font-black uppercase text-sm rounded-xl hover:bg-[#a00000] transition-all border border-[#C09A51]/30"
      >
        ⚒️ Calcular Refinado
      </button>

      {/* Result */}
      {result && (
        <div className={`rounded-xl border-2 p-6 ${
          isError(result)
            ? 'border-red-800 bg-red-900/20'
            : 'border-[#C09A51]/40 bg-black/40'
        }`}>
          {isError(result) ? (
            <p className="text-red-400 text-sm text-center">{result.error}</p>
          ) : (
            <div className="space-y-4">
              {/* Main result */}
              <div className="text-center">
                <p className="text-[10px] text-gray-500 uppercase mb-1">Producto refinado</p>
                <p className="text-[#C09A51] font-black text-xl">{result.refinedMaterial}</p>
                <p className="text-4xl font-black text-white mt-1">
                  ×{result.refinedQuantity.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </p>
              </div>

              <div className="h-px bg-[#3F2F23]" />

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Costo Silver',     value: result.silverCost.toLocaleString(),       color: 'text-yellow-400' },
                  { label: 'Retorno (%)',       value: `${(result.returnRate * 100).toFixed(1)}%`, color: 'text-green-400' },
                  { label: 'Puntos Foco',      value: result.focusPointsUsed.toLocaleString(),  color: 'text-blue-400' },
                  { label: 'Materiales Raw',   value: Object.values(result.rawMaterials)[0]?.toLocaleString() ?? '0', color: 'text-[#C09A51]' },
                ].map(s => (
                  <div key={s.label} className="bg-black/30 rounded-lg p-3">
                    <p className="text-[9px] text-gray-500 uppercase">{s.label}</p>
                    <p className={`font-black text-lg ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Raw materials detail */}
              {Object.entries(result.rawMaterials).length > 0 && (
                <div className="bg-black/20 rounded-lg p-3">
                  <p className="text-[9px] text-gray-500 uppercase mb-2">Materiales necesarios</p>
                  {Object.entries(result.rawMaterials).map(([mat, qty]) => (
                    <div key={mat} className="flex justify-between text-xs">
                      <span className="text-gray-400">{mat}</span>
                      <span className="text-white font-bold">×{qty.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
