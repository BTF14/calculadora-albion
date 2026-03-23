// ... código anterior donde buscas la bolsa (bag)

let recipe: any; // Usar 'any' temporalmente es la forma más rápida de saltar este error de unión de tipos

if (enchantment === 0) {
  recipe = bag; // Si el tier 0 es la base
} else {
  const ench = String(enchantment) as keyof typeof bag.enchantments;
  recipe = bag.enchantments[ench];
}

if (!recipe || !recipe.ingredients) {
  throw new Error(`No se encontraron ingredientes para ${itemId} encantamiento ${enchantment}`);
}

const multiplier = quantity;
const ingredients: Record<string, number> = {};

// Ahora TypeScript no debería dar error aquí
for (const [ing, qty] of Object.entries(recipe.ingredients as Record<string, number>)) {
  ingredients[ing] = (qty as number) * multiplier;
}
