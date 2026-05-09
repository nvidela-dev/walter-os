"use server";

import { db } from "@/db";
import {
  proveedores,
  proveedorProductos,
  productos,
  unidades,
  historialPrecios,
  type NewProveedor,
} from "@/db/schema";
import { eq, and, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getUnidades() {
  return db
    .select({ id: unidades.id, codigo: unidades.codigo, nombre: unidades.nombre })
    .from(unidades)
    .orderBy(unidades.nombre);
}

export async function getProviders() {
  const result = await db
    .select({
      id: proveedores.id,
      nombre: proveedores.nombre,
      descripcion: proveedores.descripcion,
      dias: proveedores.dias,
      deuda: proveedores.deuda,
      productCount: count(proveedorProductos.productoId),
    })
    .from(proveedores)
    .leftJoin(proveedorProductos, eq(proveedores.id, proveedorProductos.proveedorId))
    .groupBy(proveedores.id)
    .orderBy(proveedores.nombre);

  return result;
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
      unidadId: productos.unidadId,
      unidad: unidades.codigo,
      unidadNombre: unidades.nombre,
      descripcion: productos.descripcion,
    })
    .from(proveedorProductos)
    .innerJoin(productos, eq(proveedorProductos.productoId, productos.id))
    .innerJoin(unidades, eq(productos.unidadId, unidades.id))
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
  productData: { nombre: string; descripcion: string | null; unidadId: string },
  precio: string,
  cantidad: string
) {
  const unidad = await getUnidadOrThrow(productData.unidadId);

  // Dual-write: populate the legacy `unidad` text column alongside `unidad_id`
  // so a rollback to the previous deploy still has the old field available.
  const [product] = await db
    .insert(productos)
    .values({
      nombre: productData.nombre,
      descripcion: productData.descripcion,
      unidadId: unidad.id,
      unidad: unidad.codigo,
    })
    .returning();

  await db.insert(proveedorProductos).values({
    proveedorId,
    productoId: product.id,
    precio,
    cantidad,
  });

  await recordPriceChange({
    productoId: product.id,
    proveedorId,
    precio,
    unidadId: unidad.id,
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

  const [producto] = await db
    .select({ unidadId: productos.unidadId })
    .from(productos)
    .where(eq(productos.id, productoId));
  if (producto?.unidadId) {
    await recordPriceChange({
      productoId,
      proveedorId,
      precio,
      unidadId: producto.unidadId,
    });
  }

  revalidatePath(`/providers/${proveedorId}`);
}

export async function getProductForProvider(proveedorId: string, productoId: string) {
  const result = await db
    .select({
      id: productos.id,
      nombre: productos.nombre,
      unidadId: productos.unidadId,
      unidad: unidades.codigo,
      unidadNombre: unidades.nombre,
      descripcion: productos.descripcion,
      precio: proveedorProductos.precio,
    })
    .from(proveedorProductos)
    .innerJoin(productos, eq(proveedorProductos.productoId, productos.id))
    .innerJoin(unidades, eq(productos.unidadId, unidades.id))
    .where(
      and(
        eq(proveedorProductos.proveedorId, proveedorId),
        eq(proveedorProductos.productoId, productoId)
      )
    );
  return result[0] ?? null;
}

export async function updateProduct(
  proveedorId: string,
  productoId: string,
  data: { nombre: string; unidadId: string; precio: string }
) {
  const unidad = await getUnidadOrThrow(data.unidadId);

  await db
    .update(productos)
    .set({
      nombre: data.nombre,
      unidadId: unidad.id,
      unidad: unidad.codigo,
      updatedAt: new Date(),
    })
    .where(eq(productos.id, productoId));

  await db
    .update(proveedorProductos)
    .set({ precio: data.precio, updatedAt: new Date() })
    .where(
      and(
        eq(proveedorProductos.proveedorId, proveedorId),
        eq(proveedorProductos.productoId, productoId)
      )
    );

  await recordPriceChange({
    productoId,
    proveedorId,
    precio: data.precio,
    unidadId: unidad.id,
  });

  revalidatePath(`/providers/${proveedorId}`);
  revalidatePath(`/providers/${proveedorId}/products/${productoId}`);
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

async function getUnidadOrThrow(unidadId: string) {
  const [unidad] = await db
    .select({ id: unidades.id, codigo: unidades.codigo })
    .from(unidades)
    .where(eq(unidades.id, unidadId));
  if (!unidad) throw new Error(`Unknown unidadId: ${unidadId}`);
  return unidad;
}

export async function recordPriceChange(args: {
  productoId: string;
  proveedorId: string;
  precio: string;
  unidadId: string;
  facturaId?: string;
}) {
  await db.insert(historialPrecios).values(args);
}
