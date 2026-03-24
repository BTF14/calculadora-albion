import potionsData from '../../data/refining/potions.json';

export const calculatePotionCosts = (itemId: string, enchantment: number) => {
  // Buscamos la poción en el JSON usando el ID (ej: T4_RESISTANCE)
  const allPotions = potionsData as any;
  const potion = allPotions.tiers[itemId];

  if (!potion) {
    throw new Error(`Poción ${itemId} no encontrada en la base de datos`);
  }

  // Accedemos al encantamiento (.0, .1, .2, .3)
  // Usamos el string del número para buscar en el objeto de encantamientos
  const enchKey = enchantment.toString();
  const recipe = potion.enchantments[enchKey];

  if (!recipe) {
    throw new Error(`Encantamiento ${enchantment} no disponible para ${itemId}`);
  }

  // Retornamos los datos para la interfaz medieval
  return {
    name: potion.name,
    outputQuantity: potion.outputQuantity,
    ingredients: recipe.ingredients,
    tier: potion.tier
  };
};

/**
 * Función para calcular el costo total basado en precios de mercado
 * (Puedes conectar esto con tu estado de precios de la UI)
 */
export const getTotalProductionCost = (ingredients: Record<string, number>, prices: Record<string, number>) => {
  return Object.entries(ingredients).reduce((total, [name, amount]) => {
    const price = prices[name] || 0;
    return total + (amount * price);
  }, 0);
};
