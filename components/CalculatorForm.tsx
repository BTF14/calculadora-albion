'use client'

import { useState } from 'react'
import { calculateRefining } from '@/lib/calculations/refining'
import { ResourceType } from '@/lib/calculations/types'

export default function CalculatorForm() {
  const [resourceType, setResourceType] = useState<ResourceType>('metal')
  const [tier, setTier] = useState<number>(5)
  const [enchantment, setEnchantment] = useState<0 | 1 | 2 | 3 | 4>(0)
  const [quantity, setQuantity] = useState<number>(100)
  const [focusUsed, setFocusUsed] = useState<boolean>(false)
  const [cityBonus, setCityBonus] = useState<boolean>(true)
  const [premium, setPremium] = useState<boolean>(true)
  const [result, setResult] = useState<any>(null)

  const handleCalculate = () => {
    try {
      const output = calculateRefining({
        resourceType,
        tier,
        enchantment,
        quantity,
        focusUsed,
        cityBonus,
        premium,
      })
      setResult(output)
    } catch (err) {
      console.error(err)
      setResult({ error: (err as Error).message })
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-medium mb-1">Recurso</label>
          <select
            value={resourceType}
            onChange={(e) => setResourceType(e.target.value as ResourceType)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="metal">Metal</option>
            <option value="wood">Madera</option>
            <option value="stone">Piedra</option>
            <option value="fiber">Fibra</option>
            <option value="leather">Cuero</option>
          </select>
        </div>

        <div>
          <label className="block font-medium mb-1">Tier</label>
          <select
            value={tier}
            onChange={(e) => setTier(Number(e.target.value))}
            className="w-full border rounded px-3 py-2"
          >
            {[4,5,6,7,8].map(t => (
              <option key={t} value={t}>T{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium mb-1">Encantamiento</label>
          <select
            value={enchantment}
            onChange={(e) => setEnchantment(Number(e.target.value) as 0|1|2|3|4)}
            className="w-full border rounded px-3 py-2"
          >
            <option value={0}>Normal (.0)</option>
            <option value={1}>Poco común (.1)</option>
            <option value={2}>Raro (.2)</option>
            <option value={3}>Excepcional (.3)</option>
            <option value={4}>Prístino (.4)</option>
          </select>
        </div>

        <div>
          <label className="block font-medium mb-1">Cantidad</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            min={1}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={focusUsed}
              onChange={(e) => setFocusUsed(e.target.checked)}
              className="w-4 h-4"
            />
            <span>Usar Foco</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={cityBonus}
              onChange={(e) => setCityBonus(e.target.checked)}
              className="w-4 h-4"
            />
            <span>Bonus de ciudad</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={premium}
              onChange={(e) => setPremium(e.target.checked)}
              className="w-4 h-4"
            />
            <span>Premium activo</span>
          </label>
        </div>
      </div>

      <button
        onClick={handleCalculate}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Calcular
      </button>

      {result && (
        <div className="mt-6 p-4 border rounded bg-gray-50">
          {result.error ? (
            <p className="text-red-500">Error: {result.error}</p>
          ) : (
            <div className="space-y-2">
              <p><strong>Materiales raw:</strong> {Object.entries(result.rawMaterials).map(([k,v]) => `${k}: ${v}`).join(', ')}</p>
              <p><strong>Producto:</strong> {result.refinedMaterial} × {result.refinedQuantity.toFixed(2)}</p>
              <p><strong>Coste en silver:</strong> {result.silverCost}</p>
              <p><strong>Puntos de foco usados:</strong> {result.focusPointsUsed}</p>
              <p><strong>Retorno:</strong> {(result.returnRate * 100).toFixed(1)}%</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
