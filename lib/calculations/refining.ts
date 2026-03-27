// lib/calculations/refining.ts
// Fix #15: focusPointsUsed usa el costo real por tier (no quantity * 100 fijo)
// Costos de foco para refinado en Albion Online (con premium):
// T2:45 T3:90 T4:135 T5:270 T6:360 T7:450 T8:540 (por unidad de producto refinado)

import type {
  RefiningInput,
  RefiningOutput,
  ResourceType,
  RefiningResourceData,
} from './types';
import { getReturnRate, getStationTax } from './refiningUtils';
import metalData   from '@/data/refining/metal.json';
import woodData    from '@/data/refining/wood.json';
import stoneData   from '@/data/refining/stone.json';
import fiberData   from '@/data/refining/fiber.json';
import leatherData from '@/data/refining/leather.json';

const refiningData: Record<ResourceType, RefiningResourceData> = {
  metal:   metalData   as RefiningResourceData,
  wood:    woodData    as RefiningResourceData,
  stone:   stoneData   as RefiningResourceData,
  fiber:   fiberData   as RefiningResourceData,
  leather: leatherData as RefiningResourceData,
};

// Fix #15: costo real de foco por tier base (premium)
// Fuente: wiki oficial Albion Online
const FOCUS_COST_PER_TIER: Record<number, number> = {
  2: 45,
  3: 90,
  4: 135,
  5: 270,
  6: 360,
  7: 450,
  8: 540,
};

export function calculateRefining(input: RefiningInput): RefiningOutput {
  const {
    resourceType, tier, enchantment,
    quantity, focusUsed, cityBonus, premium,
  } = input;

  const tierKey  = enchantment > 0 ? `${tier}_${enchantment}` : String(tier);
  const tierData = refiningData[resourceType].tiers[tierKey];

  if (!tierData) {
    throw new Error(
      `Tier ${tier}${enchantment ? `.${enchantment}` : ''} no encontrado para ${resourceType}`
    );
  }

  const returnRate = getReturnRate(focusUsed, cityBonus, premium);
  const taxRate    = getStationTax(premium);

  const rawMaterials: Record<string, number> = {
    [tierData.raw]: tierData.rawCount * quantity,
  };

  const refinedQuantity = quantity * (1 + returnRate);
  const silverCost      = quantity * 10 * (1 + taxRate);

  // Fix #15: foco real por tier. Sin premium el costo es el doble.
  const focusCostPerUnit = (FOCUS_COST_PER_TIER[tier] ?? 100) * (premium ? 1 : 2);
  const focusPointsUsed  = focusUsed ? focusCostPerUnit * quantity : 0;

  return {
    rawMaterials,
    refinedMaterial:  tierData.refined,
    refinedQuantity:  Math.floor(refinedQuantity * 100) / 100,
    silverCost:       Math.floor(silverCost),
    focusPointsUsed,
    returnRate,
  };
}
