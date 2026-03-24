import potionsData from '../../data/refining/potions.json';

/**
 * Obtiene los datos de una poción específica y su receta según el encantamiento
 */
export const calculatePotionCosts = (itemId: string, enchantment: number) => {
  // Forzamos el acceso al JSON para evitar errores de unión de tipos en TS
  const data = potionsData as any;
  const potion = data.tiers[itemId];

  if (!potion) {
    throw new Error(`Poción ${itemId} no encontrada en los registros.`);
  }

  // Convertimos el número de encantamiento (0, 1, 2, 3) a string para la llave del JSON
  const enchKey = enchantment.toString();
  const recipe = potion.enchantments && potion.enchantments[enchKey];

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
 * Calcula el costo total de plata basado en los ingredientes y precios actuales
 */
export const getTotalProductionCost = (ingredients: Record<string, number>, marketPrices: Record<string, number>) => {
  return Object.entries(ingredients).reduce((total, [name, amount]) => {
    const price = marketPrices[name] || 0;
    return total + (amount * price);
  }, 0);
};
