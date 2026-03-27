// lib/calculations/transmutation.ts
import type { TransmutationInput, TransmutationOutput, ResourceType, TransmutationResourceData } from './types';
import metalData   from '@/data/transmutation/metal.json';
import woodData    from '@/data/transmutation/wood.json';
import stoneData   from '@/data/transmutation/stone.json';
import fiberData   from '@/data/transmutation/fiber.json';
import leatherData from '@/data/transmutation/leather.json';

const transmutationData: Record<ResourceType, TransmutationResourceData> = {
  metal:   metalData   as TransmutationResourceData,
  wood:    woodData    as TransmutationResourceData,
  stone:   stoneData   as TransmutationResourceData,
  fiber:   fiberData   as TransmutationResourceData,
  leather: leatherData as TransmutationResourceData,
};

export function calculateTransmutation(input: TransmutationInput): TransmutationOutput {
  const { resourceType, fromTier, fromEnchant, toTier, toEnchant, quantity } = input;
  const data = transmutationData[resourceType];

  const tierDiff    = toTier    - fromTier;
  const enchantDiff = toEnchant - fromEnchant;

  if (tierDiff === 1 && enchantDiff === 0) {
    const key          = `${fromTier}_${fromEnchant}`;
    const costPerUnit  = data.tierUp?.[key];
    if (costPerUnit === undefined) {
      throw new Error(`Costo tierUp no encontrado para ${resourceType} ${key}`);
    }
    return { requiredRaw: quantity * 20, silverCost: costPerUnit * quantity };
  }

  if (tierDiff === 0 && enchantDiff === 1) {
    const key         = `${fromTier}_${fromEnchant}_${toEnchant}`;
    const costPerUnit = data.enchantUp?.[key];
    if (costPerUnit === undefined) {
      throw new Error(`Costo enchantUp no encontrado para ${resourceType} ${key}`);
    }
    return { requiredRaw: quantity * 20, silverCost: costPerUnit * quantity };
  }

  throw new Error('Solo se soporta +1 tier O +1 encantamiento por operación.');
}
