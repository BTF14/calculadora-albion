// Importa tus datos (ajusta la ruta según tu proyecto)
import { bags } from '../data/items'; 

export const calculateBagIngredients = (itemId: string, enchantment: number, quantity: number) => {
  // 1. Buscamos el objeto base en los datos
  const bag = (bags as any)[itemId];

  if (!bag) {
    throw new Error(`Bolsa con ID ${itemId} no encontrada en la base de datos.`);
  }

  let recipe: any;

  // 2. Determinamos qué receta usar (Base o Encantamiento)
  if (enchantment === 0) {
    recipe = bag; 
  } else {
    // Convertimos el número a string para que coincida con las llaves del JSON ("1", "2", etc.)
    const enchKey = String(enchantment) as keyof typeof bag.enchantments;
    recipe = bag.enchantments?.[enchKey];
  }

  // 3. Validación de seguridad
  if (!recipe || !recipe.ingredients) {
    throw new Error(`No se encontraron ingredientes para ${itemId} con encantamiento .${enchantment}`);
  }

  // 4. Cálculo final
  const ingredients: Record<string, number> = {};
  
  for (const [ing, qty] of Object.entries(recipe.ingredients as Record<string, number>)) {
    ingredients[ing] = (qty as number) * quantity;
  }

  return ingredients;
};
