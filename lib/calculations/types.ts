// lib/calculations/types.ts — Tipos de dominio para cálculos (cero `any`)

export type ResourceType  = 'metal' | 'wood' | 'stone' | 'fiber' | 'leather';
export type Enchantment   = 0 | 1 | 2 | 3 | 4;

// ─── REFINADO ─────────────────────────────────────────────────
export interface RefiningInput {
  resourceType: ResourceType;
  tier:         number;
  enchantment:  Enchantment;
  quantity:     number;
  focusUsed:    boolean;
  cityBonus:    boolean;
  premium:      boolean;
}

export interface RefiningOutput {
  rawMaterials:     Record<string, number>;
  refinedMaterial:  string;
  refinedQuantity:  number;
  silverCost:       number;
  focusPointsUsed:  number;
  returnRate:       number;
}

// ─── TRANSMUTACIÓN ────────────────────────────────────────────
export interface TransmutationInput {
  resourceType: ResourceType;
  fromTier:     number;
  fromEnchant:  Enchantment;
  toTier:       number;
  toEnchant:    Enchantment;
  quantity:     number;
}

export interface TransmutationOutput {
  requiredRaw: number;
  silverCost:  number;
}

// ─── CRAFTING (Bags / Food / Potions) ─────────────────────────
export interface CraftingInput {
  itemId:      string;
  enchantment: Enchantment;
  quantity:    number;
}

export interface CraftingOutput {
  ingredients:    Record<string, number>;
  outputQuantity: number;
  fame:           number;
  focusPoints:    number;
}

// ─── JSON DATA SHAPES ─────────────────────────────────────────
// Estructura de los archivos en data/refining/*.json
export interface RefiningTierData {
  raw:      string;
  refined:  string;
  rawCount: number;
}

export interface RefiningResourceData {
  tiers: Record<string, RefiningTierData>;
}

// Estructura de data/transmutation/*.json
export interface TransmutationResourceData {
  tierUp?:    Record<string, number>;
  enchantUp?: Record<string, number>;
}

// Estructura de data/food.json (por ítem)
export interface FoodRecipeData {
  outputQuantity: number;
  fame:           number;
  focus:          number;
  ingredients:    Record<string, number>;
}

// Estructura de data/potions.json
export interface PotionEnchantData {
  ingredients: Record<string, number>;
}

export interface PotionTierData {
  name:           string;
  tier:           number;
  outputQuantity: number;
  enchantments:   Record<string, PotionEnchantData>;
}

export interface PotionsData {
  tiers: Record<string, PotionTierData>;
}

// Estructura de data/bags.json y data/visionBags.json
export interface BagEnchantData {
  ingredients: Record<string, number>;
}

export interface BagItemData {
  tier:         number;
  enchantments: Record<string, BagEnchantData>;
}
