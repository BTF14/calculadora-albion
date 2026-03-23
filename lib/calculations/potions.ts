import { CraftingInput, CraftingOutput } from './types';
import potionsData from '@/data/potions.json';

export function calculatePotion(input: CraftingInput): CraftingOutput {
  const { itemId, enchantment, quantity } = input;
  const potion = potionsData[itemId as keyof typeof potionsData];
  if (!potion) throw new Error(`Poción ${itemId} no encontrada`);

  const ench = enchantment as keyof typeof potion.enchantments;
  const recipe = potion.enchantments[ench];
  if (!recipe) throw new Error(`Encantamiento ${enchantment} no encontrado para ${itemId}`);

  const multiplier = quantity / potion.outputQuantity;
  const ingredients: Record<string, number> = {};
  for (const [ing, qty] of Object.entries(recipe.ingredients)) {
    ingredients[ing] = qty * multiplier;
  }

  return {
    ingredients,
    outputQuantity: quantity,
    fame: 0,
    focusPoints: 0,
  };
}
