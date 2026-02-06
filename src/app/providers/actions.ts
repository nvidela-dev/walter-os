"use server";

import { db } from "@/db";
import { proveedores, proveedorProductos, productos, type NewProveedor } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getProviders() {
  return db.select().from(proveedores).orderBy(proveedores.nombre);
}

export async function getProvider(id: string) {
  const result = await db.select().from(proveedores).where(eq(proveedores.id, id));
  return result[0] ?? null;
}

export async function getProviderWithProducts(id: string) {
  const provider = await getProvider(id);
  if (!provider) return null;

  const providerProducts = await db
    .select({
      productoId: proveedorProductos.productoId,
      precio: proveedorProductos.precio,
      nombre: productos.nombre,
      unidad: productos.unidad,
    })
    .from(proveedorProductos)
    .innerJoin(productos, eq(proveedorProductos.productoId, productos.id))
    .where(eq(proveedorProductos.proveedorId, id));

  return { ...provider, productos: providerProducts };
}

export async function createProvider(data: NewProveedor) {
  const result = await db.insert(proveedores).values(data).returning();
  revalidatePath("/providers");
  return result[0];
}

export async function updateProvider(id: string, data: Partial<NewProveedor>) {
  const result = await db
    .update(proveedores)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(proveedores.id, id))
    .returning();
  revalidatePath("/providers");
  revalidatePath(`/providers/${id}`);
  return result[0];
}

export async function deleteProvider(id: string) {
  await db.delete(proveedores).where(eq(proveedores.id, id));
  revalidatePath("/providers");
}

export async function addProductToProvider(
  proveedorId: string,
  productoId: string,
  precio: string
) {
  await db.insert(proveedorProductos).values({ proveedorId, productoId, precio });
  revalidatePath(`/providers/${proveedorId}`);
}

export async function removeProductFromProvider(proveedorId: string, productoId: string) {
  await db
    .delete(proveedorProductos)
    .where(
      eq(proveedorProductos.proveedorId, proveedorId)
    );
  revalidatePath(`/providers/${proveedorId}`);
}

export async function updateProviderProductPrice(
  proveedorId: string,
  productoId: string,
  precio: string
) {
  await db
    .update(proveedorProductos)
    .set({ precio, updatedAt: new Date() })
    .where(eq(proveedorProductos.proveedorId, proveedorId));
  revalidatePath(`/providers/${proveedorId}`);
}
