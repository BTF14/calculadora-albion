// @ts-ignore
import potionsData from '@/data/refining/potions.json';

/**
 * Obtiene los datos de una poción y su receta
 */
export const calculatePotionCosts = (itemId: string, enchantment: number) => {
  const data = potionsData as any;
  const potion = data.tiers[itemId];

  if (!potion) {
    throw new Error(`Poción ${itemId} no encontrada.`);
  }

  const enchKey = enchantment.toString();
  const recipe = potion.enchantments ? potion.enchantments[enchKey] : null;

  if (!recipe) {
    throw new Error(`Encantamiento ${enchantment} no disponible para ${itemId}`);
  }

  return {
    name: potion.name,
    tier: potion.tier,
    outputQuantity: potion.outputQuantity,
    ingredients: recipe.ingredients
  };
};

/**
 * Calcula el costo total de plata
 */
export const getTotalProductionCost = (ingredients: Record<string, number>, marketPrices: Record<string, number>) => {
  return Object.entries(ingredients).reduce((total, [name, amount]) => {
    const price = marketPrices[name] || 0;
    return total + (amount * price);
  }, 0);
};
