"use server";

import { db } from "@/db";
import { recetas, recetaProductos, productos, type NewReceta } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getRecipes() {
  return db.select().from(recetas).orderBy(recetas.nombre);
}

export async function getRecipe(id: string) {
  const result = await db.select().from(recetas).where(eq(recetas.id, id));
  return result[0] ?? null;
}

export async function getRecipeWithIngredients(id: string) {
  const recipe = await getRecipe(id);
  if (!recipe) return null;
  const ingredients = await db
    .select({ productoId: recetaProductos.productoId, cantidad: recetaProductos.cantidad, nombre: productos.nombre, unidad: productos.unidad })
    .from(recetaProductos)
    .innerJoin(productos, eq(recetaProductos.productoId, productos.id))
    .where(eq(recetaProductos.recetaId, id));
  return { ...recipe, ingredientes: ingredients };
}

export async function createRecipe(data: NewReceta) {
  const result = await db.insert(recetas).values(data).returning();
  revalidatePath("/recipes");
  return result[0];
}

export async function updateRecipe(id: string, data: Partial<NewReceta>) {
  const result = await db.update(recetas).set({ ...data, updatedAt: new Date() }).where(eq(recetas.id, id)).returning();
  revalidatePath("/recipes");
  return result[0];
}

export async function deleteRecipe(id: string) {
  await db.delete(recetas).where(eq(recetas.id, id));
  revalidatePath("/recipes");
}
