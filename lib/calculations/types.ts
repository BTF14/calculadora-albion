export type ResourceType = 'metal' | 'wood' | 'stone' | 'fiber' | 'leather';

export interface RefiningInput {
  resourceType: ResourceType;
  tier: number;
  enchantment: 0 | 1 | 2 | 3 | 4;
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
  fromEnchant: 0 | 1 | 2 | 3 | 4;
  toTier: number;
  toEnchant: 0 | 1 | 2 | 3 | 4;
  quantity: number;
}

export interface TransmutationOutput {
  requiredRaw: number;
  silverCost: number;
}

export interface CraftingInput {
  itemId: string;
  enchantment: 0 | 1 | 2 | 3;
  quantity: number;
}

export interface CraftingOutput {
  ingredients: Record<string, number>;
  outputQuantity: number;
  fame: number;
  focusPoints: number;
}
