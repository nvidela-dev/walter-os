"use server";

import { db } from "@/db";
import { menu, recetas, type NewMenuItem } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getMenuItems() {
  return db.select({ id: menu.id, nombre: menu.nombre, descripcion: menu.descripcion, precioVenta: menu.precioVenta, recetaId: menu.recetaId, recetaNombre: recetas.nombre })
    .from(menu)
    .leftJoin(recetas, eq(menu.recetaId, recetas.id))
    .orderBy(menu.nombre);
}

export async function getMenuItem(id: string) {
  const result = await db.select().from(menu).where(eq(menu.id, id));
  return result[0] ?? null;
}

export async function createMenuItem(data: NewMenuItem) {
  const result = await db.insert(menu).values(data).returning();
  revalidatePath("/menu");
  return result[0];
}

export async function updateMenuItem(id: string, data: Partial<NewMenuItem>) {
  const result = await db.update(menu).set({ ...data, updatedAt: new Date() }).where(eq(menu.id, id)).returning();
  revalidatePath("/menu");
  return result[0];
}

export async function deleteMenuItem(id: string) {
  await db.delete(menu).where(eq(menu.id, id));
  revalidatePath("/menu");
}

export async function getAllRecipes() {
  return db.select({ id: recetas.id, nombre: recetas.nombre }).from(recetas).orderBy(recetas.nombre);
}
