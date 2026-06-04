import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { products, recipeProducts, recipes, units } from "@/db/schema";
import type { RecipeDetail, RecipeIngredient, RecipeView } from "@/lib/types/recipes";
import { parseUuidOrNull } from "@/lib/validation";

const recipeSelection = {
  id: recipes.id,
  name: recipes.name,
  description: recipes.description,
};

export async function getRecipes(): Promise<RecipeView[]> {
  return db.select(recipeSelection).from(recipes).orderBy(recipes.name);
}

export async function getRecipe(id: string): Promise<RecipeView | null> {
  const parsedId = parseUuidOrNull(id);
  if (parsedId === null) return null;

  const [recipe] = await db.select(recipeSelection).from(recipes).where(eq(recipes.id, parsedId));
  return recipe ?? null;
}

export async function getRecipeWithIngredients(id: string): Promise<RecipeDetail | null> {
  const recipe = await getRecipe(id);
  if (!recipe) return null;

  const ingredients: RecipeIngredient[] = await db
    .select({
      productId: recipeProducts.productId,
      quantity: recipeProducts.quantity,
      name: products.name,
      unit: units.code,
    })
    .from(recipeProducts)
    .innerJoin(products, eq(recipeProducts.productId, products.id))
    .innerJoin(units, eq(products.unitId, units.id))
    .where(eq(recipeProducts.recipeId, recipe.id));

  return { ...recipe, ingredients };
}
