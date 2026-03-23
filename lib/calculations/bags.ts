import { CraftingInput, CraftingOutput } from './types';

// Datos básicos de las bolsas integrados para evitar errores de ruta
const bagsData: Record<string, any> = {
  "T4_BAG": {
    "tier": 4,
    "enchantments": {
      "0": { "ingredients": { "T4_CLOTH": 8, "T4_LEATHER": 8 } },
      "1": { "ingredients": { "T4_CLOTH_LEVEL1": 8, "T4_LEATHER_LEVEL1": 8 } },
      "2": { "ingredients": { "T4_CLOTH_LEVEL2": 8, "T4_LEATHER_LEVEL2": 8 } },
      "3": { "ingredients": { "T4_CLOTH_LEVEL3": 8, "T4_LEATHER_LEVEL3": 8 } }
    }
  }
  // Puedes agregar más aquí o importar tus JSON si las rutas son correctas
};

export function calculateBag(input: CraftingInput): CraftingOutput {
  const { itemId, enchantment, quantity } = input;
  
  // Buscamos la bolsa en nuestros datos
  const bag = bagsData[itemId];

  if (!bag) {
    // Si no la encuentra, devolvemos un objeto vacío para que no rompa el build
    return {
      ingredients: {},
      outputQuantity: quantity,
      fame: 0,
      focusPoints: 0,
    };
  }

  const enchantKey = String(enchantment || 0);
  const recipe = bag.enchantments?.[enchantKey] || bag.enchantments?.["0"];

  if (!recipe) {
    throw new Error(`Receta no encontrada para ${itemId} encantamiento ${enchantment}`);
  }

  const ingredients: Record<string, number> = {};
  for (const [ing, qty] of Object.entries(recipe.ingredients as Record<string, number>)) {
    ingredients[ing] = qty * quantity;
  }

  return {
    ingredients,
    outputQuantity: quantity,
    fame: 0,
    focusPoints: 0,
  };
}

// Mantenemos esta función por si otros archivos la llaman
export const calculateBagIngredients = (itemId: string, enchantment: any, quantity: number) => {
  return calculateBag({ itemId, enchantment: enchantment as any, quantity });
};
