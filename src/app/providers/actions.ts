"use server";

import { db } from "@/db";
import { proveedores, proveedorProductos, productos, type NewProveedor, type NewProducto } from "@/db/schema";
import { eq, and } from "drizzle-orm";
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
      id: productos.id,
      productoId: proveedorProductos.productoId,
      precio: proveedorProductos.precio,
      cantidad: proveedorProductos.cantidad,
      nombre: productos.nombre,
      unidad: productos.unidad,
      descripcion: productos.descripcion,
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

// Create a product and link it to a provider
export async function createProductForProvider(
  proveedorId: string,
  productData: NewProducto,
  precio: string,
  cantidad: string
) {
  // Create the product
  const [product] = await db.insert(productos).values(productData).returning();

  // Link it to the provider with price and quantity
  await db.insert(proveedorProductos).values({
    proveedorId,
    productoId: product.id,
    precio,
    cantidad,
  });

  revalidatePath(`/providers/${proveedorId}`);
  return product;
}

export async function updateProductPrice(
  proveedorId: string,
  productoId: string,
  precio: string
) {
  await db
    .update(proveedorProductos)
    .set({ precio, updatedAt: new Date() })
    .where(
      and(
        eq(proveedorProductos.proveedorId, proveedorId),
        eq(proveedorProductos.productoId, productoId)
      )
    );
  revalidatePath(`/providers/${proveedorId}`);
}

export async function removeProductFromProvider(proveedorId: string, productoId: string) {
  // Remove the link
  await db
    .delete(proveedorProductos)
    .where(
      and(
        eq(proveedorProductos.proveedorId, proveedorId),
        eq(proveedorProductos.productoId, productoId)
      )
    );
  // Delete the product itself since products must belong to a provider
  await db.delete(productos).where(eq(productos.id, productoId));
  revalidatePath(`/providers/${proveedorId}`);
}
