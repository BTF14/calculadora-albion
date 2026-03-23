import { CraftingInput, CraftingOutput } from './types';
import bagsData from '@/data/bags.json';
import visionBagsData from '@/data/visionBags.json';

export function calculateBag(input: CraftingInput & { isVision?: boolean }): CraftingOutput {
  const { itemId, enchantment, quantity, isVision = false } = input;
  const data = isVision ? visionBagsData : bagsData;
  const bag = data[itemId as keyof typeof data];
  if (!bag) throw new Error(`Bolsa ${itemId} no encontrada`);

  let recipe;
  if (bag.tier === 2 || bag.tier === 3) {
    recipe = bag;
  } else {
    const enchantKey = String(enchantment) as keyof typeof bag.enchantments;
    recipe = bag.enchantments[enchantKey];
    if (!recipe) throw new Error(`Encantamiento ${enchantment} no encontrado para ${itemId}`);
  }

  const multiplier = quantity;
  const ingredients: Record<string, number> = {};
  for (const [ing, qty] of Object.entries(recipe.ingredients)) {
    ingredients[ing] = qty * multiplier;
  }

  if (isVision && bag.tome) {
    ingredients[bag.tome] = (ingredients[bag.tome] || 0) + multiplier;
  }

  return {
    ingredients,
    outputQuantity: quantity,
    fame: 0,
    focusPoints: 0,
  };
}
