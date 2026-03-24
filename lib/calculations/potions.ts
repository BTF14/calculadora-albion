import potionsData from '../../data/refining/potions.json';

export const calculatePotionCosts = (itemId: string, enchantment: number) => {
  const data = potionsData as any;
  const potion = data.tiers[itemId];

  if (!potion) {
    throw new Error(`Poción ${itemId} no encontrada`);
  }

  const enchKey = enchantment.toString();
  // Acceso seguro: si no existen encantamientos, no rompe el build
  const recipe = potion.enchantments ? potion.enchantments[enchKey] : null;

  if (!recipe) {
    throw new Error(`Encantamiento ${enchantment} no encontrado para ${itemId}`);
  }

  return {
    name: potion.name,
    tier: potion.tier,
    outputQuantity: potion.outputQuantity,
    ingredients: recipe.ingredients
  };
};

export const getTotalProductionCost = (ingredients: Record<string, number>, marketPrices: Record<string, number>) => {
  return Object.entries(ingredients).reduce((total, [name, amount]) => {
    const price = marketPrices[name] || 0;
    return total + (amount * price);
  }, 0);
};
