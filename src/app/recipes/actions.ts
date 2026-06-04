"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { productos, type Receta, recetaProductos, recetas, unidades } from "@/db/schema";
import { actionError, actionOk, type ActionResult, unknownActionError } from "@/lib/action-result";
import { uuidSchema } from "@/lib/validation";

import { recipeInputSchema } from "./schema";

export interface RecipeIngredient {
  productoId: string;
  cantidad: string;
  nombre: string;
  unidad: string;
}

export async function getRecipes(): Promise<Receta[]> {
  return db.select().from(recetas).orderBy(recetas.nombre);
}

export async function getRecipe(id: string): Promise<Receta | null> {
  const result = await db.select().from(recetas).where(eq(recetas.id, id));
  return result[0] ?? null;
}

export async function getRecipeWithIngredients(
  id: string
): Promise<(Receta & { ingredientes: RecipeIngredient[] }) | null> {
  const recipe = await getRecipe(id);
  if (!recipe) return null;
  const ingredients = await db
    .select({
      productoId: recetaProductos.productoId,
      cantidad: recetaProductos.cantidad,
      nombre: productos.nombre,
      unidad: unidades.codigo,
    })
    .from(recetaProductos)
    .innerJoin(productos, eq(recetaProductos.productoId, productos.id))
    .innerJoin(unidades, eq(productos.unidadId, unidades.id))
    .where(eq(recetaProductos.recetaId, id));
  return { ...recipe, ingredientes: ingredients };
}

export async function createRecipe(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = recipeInputSchema.safeParse(input);
  if (!parsed.success) return unknownActionError(parsed.error);

  try {
    const [created] = await db.insert(recetas).values(parsed.data).returning({ id: recetas.id });
    if (!created) return actionError("No se pudo crear la receta.");
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
      .update(recetas)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(recetas.id, parsedId.data))
      .returning({ id: recetas.id });

    if (!updated) return actionError("Receta no encontrada.");

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
      .delete(recetas)
      .where(eq(recetas.id, parsedId.data))
      .returning({ id: recetas.id });

    if (!deleted) return actionError("Receta no encontrada.");

    revalidatePath("/recipes");
    return actionOk(undefined);
  } catch (error) {
    return unknownActionError(error);
  }
}
