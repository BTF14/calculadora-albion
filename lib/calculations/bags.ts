// lib/calculations/bags.ts
import type { CraftingInput, CraftingOutput, BagItemData } from './types';
import bagsJson     from '@/data/bags.json';
import visionBagsJson from '@/data/visionBags.json';

// Fusionar ambos catálogos en un Record tipado
const allBags: Record<string, BagItemData> = {
  ...(bagsJson     as Record<string, BagItemData>),
  ...(visionBagsJson as Record<string, BagItemData>),
};

export function calculateBag(input: CraftingInput): CraftingOutput {
  const { itemId, enchantment, quantity } = input;

  const bag = allBags[itemId];
  if (!bag) {
    // Ítem no catalogado: devolvemos vacío sin romper el build
    return { ingredients: {}, outputQuantity: quantity, fame: 0, focusPoints: 0 };
  }

  const enchKey  = String(enchantment);
  const recipe   = bag.enchantments[enchKey] ?? bag.enchantments['0'];
  if (!recipe) {
    throw new Error(`Receta no encontrada para ${itemId} encantamiento ${enchantment}`);
  }

  const ingredients: Record<string, number> = {};
  for (const [mat, qty] of Object.entries(recipe.ingredients)) {
    ingredients[mat] = qty * quantity;
  }

  return { ingredients, outputQuantity: quantity, fame: 0, focusPoints: 0 };
}

// Alias para compatibilidad con código existente
export const calculateBagIngredients = (
  itemId: string,
  enchantment: number,
  quantity: number
): CraftingOutput => calculateBag({ itemId, enchantment: enchantment as 0|1|2|3|4, quantity });
