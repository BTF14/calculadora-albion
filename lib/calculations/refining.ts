import { RefiningInput, RefiningOutput, ResourceType } from './types';
import { getReturnRate, getStationTax } from './refiningUtils';
import metalData from '@/data/refining/metal.json';
import woodData from '@/data/refining/wood.json';
import stoneData from '@/data/refining/stone.json';
import fiberData from '@/data/refining/fiber.json';
import leatherData from '@/data/refining/leather.json';

const refiningData: Record<ResourceType, any> = {
  metal: metalData,
  wood: woodData,
  stone: stoneData,
  fiber: fiberData,
  leather: leatherData,
};

export function calculateRefining(input: RefiningInput): RefiningOutput {
  const { resourceType, tier, enchantment, quantity, focusUsed, cityBonus, premium } = input;

  // Obtener los datos del tier. Para encantamientos se usa la clave con sufijo _1, etc.
  let tierKey = tier.toString();
  if (enchantment > 0) tierKey = `${tier}_${enchantment}`;
  const tierData = refiningData[resourceType].tiers[tierKey];
  if (!tierData) throw new Error(`Tier ${tier}${enchantment ? ` encantamiento ${enchantment}` : ''} no encontrado para ${resourceType}`);

  const returnRate = getReturnRate(focusUsed, cityBonus, premium);
  const taxRate = getStationTax(premium);

  const rawCount = tierData.rawCount;
  const rawMaterialName = tierData.raw;
  const rawMaterials: Record<string, number> = { [rawMaterialName]: rawCount * quantity };

  const refinedQuantity = quantity * (1 + returnRate);
  const refinedMaterial = tierData.refined;

  const silverCost = quantity * 10 * (1 + taxRate);
  const focusPointsUsed = focusUsed ? 100 : 0;

  return {
    rawMaterials,
    refinedMaterial,
    refinedQuantity: Math.floor(refinedQuantity * 100) / 100,
    silverCost: Math.floor(silverCost),
    focusPointsUsed,
    returnRate,
  };
}
