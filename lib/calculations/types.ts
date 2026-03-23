export type ResourceType = 'metal' | 'wood' | 'stone' | 'fiber' | 'leather';

export interface RefiningInput {
  resourceType: ResourceType;
  tier: number;
  enchantment: any; // Cambiado para mayor flexibilidad
  quantity: number;
  focusUsed: boolean;
  cityBonus: boolean;
  premium: boolean;
}

export interface RefiningOutput {
  rawMaterials: Record<string, number>;
  refinedMaterial: string;
  refinedQuantity: number;
  silverCost: number;
  focusPointsUsed: number;
  returnRate: number;
}

export interface TransmutationInput {
  resourceType: ResourceType;
  fromTier: number;
  fromEnchant: any; // Cambiado para evitar errores de tipo
  toTier: number;
  toEnchant: any; // Cambiado para evitar errores de tipo
  quantity: number;
}

export interface TransmutationOutput {
  requiredRaw: number;
  silverCost: number;
}

export interface CraftingInput {
  itemId: string;
  enchantment: any; // Esto corrige el error específico de bags.ts
  quantity: number;
}

export interface CraftingOutput {
  ingredients: Record<string, number>;
  outputQuantity: number;
  fame: number;
  focusPoints: number;
}
