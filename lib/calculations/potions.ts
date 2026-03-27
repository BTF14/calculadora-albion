// lib/calculations/potions.ts
import type { PotionsData } from './types';
import potionsJson from '@/data/potions.json';

const potionsData = potionsJson as unknown as PotionsData;

export interface PotionResult {
  name:           string;
  tier:           number;
  outputQuantity: number;
  ingredients:    Record<string, number>;
}

export function calculatePotionCosts(itemId: string, enchantment: number): PotionResult {
  const potion = potionsData.tiers[itemId];
  if (!potion) throw new Error(`Poción "${itemId}" no encontrada.`);

  const recipe = potion.enchantments[String(enchantment)];
  if (!recipe) {
    throw new Error(`Encantamiento ${enchantment} no disponible para ${itemId}`);
  }

  return {
    name:           potion.name,
    tier:           potion.tier,
    outputQuantity: potion.outputQuantity,
    ingredients:    recipe.ingredients,
  };
}

export function getTotalProductionCost(
  ingredients: Record<string, number>,
  marketPrices: Record<string, number>
): number {
  return Object.entries(ingredients).reduce((total, [name, amount]) => {
    return total + amount * (marketPrices[name] ?? 0);
  }, 0);
}
