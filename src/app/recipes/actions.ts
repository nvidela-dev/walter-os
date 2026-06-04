"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { products, type Recipe, recipeProducts, recipes, units } from "@/db/schema";
import { t } from "@/i18n";
import { actionError, actionOk, type ActionResult, unknownActionError } from "@/lib/action-result";
import { optionalTextSchema, requiredTextSchema, uuidSchema } from "@/lib/validation";

const recipeInputSchema = z.object({
  name: requiredTextSchema,
  description: optionalTextSchema,
});

export type RecipeInput = z.infer<typeof recipeInputSchema>;

export interface RecipeIngredient {
  productId: string;
  quantity: string;
  name: string;
  unit: string;
}

export async function getRecipes(): Promise<Recipe[]> {
  return db.select().from(recipes).orderBy(recipes.name);
}

export async function getRecipe(id: string): Promise<Recipe | null> {
  const result = await db.select().from(recipes).where(eq(recipes.id, id));
  return result[0] ?? null;
}

export async function getRecipeWithIngredients(
  id: string
): Promise<(Recipe & { ingredients: RecipeIngredient[] }) | null> {
  const recipe = await getRecipe(id);
  if (!recipe) return null;
  const ingredients = await db
    .select({
      productId: recipeProducts.productId,
      quantity: recipeProducts.quantity,
      name: products.name,
      unit: units.code,
    })
    .from(recipeProducts)
    .innerJoin(products, eq(recipeProducts.productId, products.id))
    .innerJoin(units, eq(products.unitId, units.id))
    .where(eq(recipeProducts.recipeId, id));
  return { ...recipe, ingredients };
}

export async function createRecipe(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = recipeInputSchema.safeParse(input);
  if (!parsed.success) return unknownActionError(parsed.error);

  try {
    const [created] = await db.insert(recipes).values(parsed.data).returning({ id: recipes.id });
    if (!created) return actionError(t.errors.recipe.createFailed);
    revalidatePath("/recipes");
    return actionOk(created);
  } catch (error) {
    return unknownActionError(error);
  }
}

export async function updateRecipe(
  id: string,
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) return unknownActionError(parsedId.error);

  const parsed = recipeInputSchema.safeParse(input);
  if (!parsed.success) return unknownActionError(parsed.error);

  try {
    const [updated] = await db
      .update(recipes)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(recipes.id, parsedId.data))
      .returning({ id: recipes.id });

    if (!updated) return actionError(t.errors.recipe.notFound);

    revalidatePath("/recipes");
    revalidatePath(`/recipes/${parsedId.data}`);
    return actionOk(updated);
  } catch (error) {
    return unknownActionError(error);
  }
}

export async function deleteRecipe(id: string): Promise<ActionResult> {
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) return unknownActionError(parsedId.error);

  try {
    const [deleted] = await db
      .delete(recipes)
      .where(eq(recipes.id, parsedId.data))
      .returning({ id: recipes.id });

    if (!deleted) return actionError(t.errors.recipe.notFound);

    revalidatePath("/recipes");
    return actionOk(undefined);
  } catch (error) {
    return unknownActionError(error);
  }
}
