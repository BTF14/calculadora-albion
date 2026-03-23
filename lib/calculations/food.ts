import { CraftingInput, CraftingOutput } from './types';
import foodData from '@/data/food.json';

export function calculateFood(input: CraftingInput): CraftingOutput {
  const { itemId, quantity } = input;
  const recipe = foodData[itemId as keyof typeof foodData];
  if (!recipe) throw new Error(`Comida ${itemId} no encontrada`);

  const multiplier = quantity / recipe.outputQuantity;
  const ingredients: Record<string, number> = {};
  for (const [ing, qty] of Object.entries(recipe.ingredients)) {
    ingredients[ing] = qty * multiplier;
  }

  return {
    ingredients,
    outputQuantity: quantity,
    fame: recipe.fame * multiplier,
    focusPoints: recipe.focus * multiplier,
  };
}
