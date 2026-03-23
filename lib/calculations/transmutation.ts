import { TransmutationInput, TransmutationOutput, ResourceType } from './types';
import metalData from '@/data/transmutation/metal.json';
import woodData from '@/data/transmutation/wood.json';
import stoneData from '@/data/transmutation/stone.json';
import fiberData from '@/data/transmutation/fiber.json';
import leatherData from '@/data/transmutation/leather.json';

const transmutationData: Record<ResourceType, any> = {
  metal: metalData,
  wood: woodData,
  stone: stoneData,
  fiber: fiberData,
  leather: leatherData,
};

export function calculateTransmutation(input: TransmutationInput): TransmutationOutput {
  const { resourceType, fromTier, fromEnchant, toTier, toEnchant, quantity } = input;
  const data = transmutationData[resourceType];

  const tierDiff = toTier - fromTier;
  const enchantDiff = toEnchant - fromEnchant;

  if (tierDiff === 1 && enchantDiff === 0) {
    const key = `${fromTier}_${fromEnchant}`;
    const costPerUnit = data.tierUp?.[key];
    if (!costPerUnit) throw new Error(`Costo no encontrado para tierUp ${key}`);
    return { requiredRaw: quantity * 20, silverCost: costPerUnit * quantity };
  } else if (tierDiff === 0 && enchantDiff === 1) {
    const key = `${fromTier}_${fromEnchant}_${toEnchant}`;
    const costPerUnit = data.enchantUp?.[key];
    if (!costPerUnit) throw new Error(`Costo no encontrado para enchantUp ${key}`);
    return { requiredRaw: quantity * 20, silverCost: costPerUnit * quantity };
  } else {
    throw new Error('Combinación no soportada (solo +1 tier o +1 encantamiento)');
  }
}
