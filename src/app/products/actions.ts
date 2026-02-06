"use server";

import { db } from "@/db";
import { productos, type NewProducto } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getProducts() {
  return db.select().from(productos).orderBy(productos.nombre);
}

export async function getProduct(id: string) {
  const result = await db.select().from(productos).where(eq(productos.id, id));
  return result[0] ?? null;
}

export async function createProduct(data: NewProducto) {
  const result = await db.insert(productos).values(data).returning();
  revalidatePath("/products");
  return result[0];
}

export async function updateProduct(id: string, data: Partial<NewProducto>) {
  const result = await db
    .update(productos)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(productos.id, id))
    .returning();
  revalidatePath("/products");
  return result[0];
}

export async function deleteProduct(id: string) {
  await db.delete(productos).where(eq(productos.id, id));
  revalidatePath("/products");
}
