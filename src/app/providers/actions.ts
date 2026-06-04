"use server";

import { randomUUID } from "node:crypto";
import { db } from "@/db";
import {
  facturaLineas,
  facturas,
  historialPrecios,
  productos,
  proveedorProductos,
  proveedores,
  recetaProductos,
  unidades,
} from "@/db/schema";
import {
  actionError,
  actionOk,
  expectedActionError,
  type ActionResult,
  unknownActionError,
} from "@/lib/action-result";
import {
  moneySchema,
  nonNegativeMoneySchema,
  optionalTextSchema,
  providerDaysSchema,
  proveedorTipoSchema,
  quantitySchema,
  requiredTextSchema,
  uuidSchema,
} from "@/lib/validation";
import { getProductDeleteBlock, getProviderDeleteBlock } from "@/lib/delete-guards";
import { and, count, eq, type SQL } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const providerInputSchema = z.object({
  nombre: requiredTextSchema,
  descripcion: optionalTextSchema,
  tipo: proveedorTipoSchema,
  dias: providerDaysSchema,
});

const debtInputSchema = z.object({
  deuda: nonNegativeMoneySchema,
});

const createProductInputSchema = z.object({
  proveedorId: uuidSchema,
  productData: z.object({
    nombre: requiredTextSchema,
    descripcion: optionalTextSchema,
    unidadId: uuidSchema,
  }),
  precio: moneySchema,
  cantidad: quantitySchema,
});

const updateProductInputSchema = z.object({
  proveedorId: uuidSchema,
  productoId: uuidSchema,
  data: z.object({
    nombre: requiredTextSchema,
    unidadId: uuidSchema,
    precio: moneySchema,
  }),
});

const productProviderInputSchema = z.object({
  proveedorId: uuidSchema,
  productoId: uuidSchema,
});

export type ProviderInput = z.infer<typeof providerInputSchema>;
export type ProviderDebtInput = z.infer<typeof debtInputSchema>;

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
      tipo: proveedores.tipo,
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

export async function createProvider(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = providerInputSchema.safeParse(input);
  if (!parsed.success) return unknownActionError(parsed.error);

  try {
    const [created] = await db.insert(proveedores).values(parsed.data).returning({ id: proveedores.id });
    revalidatePath("/providers");
    return actionOk(created);
  } catch (error) {
    return unknownActionError(error);
  }
}

export async function updateProvider(
  id: string,
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) return unknownActionError(parsedId.error);

  const parsed = providerInputSchema.safeParse(input);
  if (!parsed.success) return unknownActionError(parsed.error);

  try {
    const [updated] = await db
      .update(proveedores)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(proveedores.id, parsedId.data))
      .returning({ id: proveedores.id });

    if (!updated) return actionError("Proveedor no encontrado.");

    revalidatePath("/providers");
    revalidatePath(`/providers/${parsedId.data}`);
    return actionOk(updated);
  } catch (error) {
    return unknownActionError(error);
  }
}

export async function updateProviderDebt(
  id: string,
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) return unknownActionError(parsedId.error);

  const parsed = debtInputSchema.safeParse(input);
  if (!parsed.success) return unknownActionError(parsed.error);

  try {
    const [updated] = await db
      .update(proveedores)
      .set({ deuda: parsed.data.deuda, updatedAt: new Date() })
      .where(eq(proveedores.id, parsedId.data))
      .returning({ id: proveedores.id });

    if (!updated) return actionError("Proveedor no encontrado.");

    revalidatePath("/providers");
    revalidatePath(`/providers/${parsedId.data}`);
    return actionOk(updated);
  } catch (error) {
    return unknownActionError(error);
  }
}

export async function deleteProvider(id: string): Promise<ActionResult> {
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) return unknownActionError(parsedId.error);

  try {
    const [productLinks, invoices, priceHistory] = await Promise.all([
      countRows(proveedorProductos, eq(proveedorProductos.proveedorId, parsedId.data)),
      countRows(facturas, eq(facturas.proveedorId, parsedId.data)),
      countRows(historialPrecios, eq(historialPrecios.proveedorId, parsedId.data)),
    ]);

    const blockMessage = getProviderDeleteBlock({
      products: productLinks,
      invoices,
      priceHistory,
    });
    if (blockMessage) return actionError(blockMessage);

    const [deleted] = await db
      .delete(proveedores)
      .where(eq(proveedores.id, parsedId.data))
      .returning({ id: proveedores.id });

    if (!deleted) return actionError("Proveedor no encontrado.");

    revalidatePath("/providers");
    return actionOk(undefined);
  } catch (error) {
    return unknownActionError(error);
  }
}

export async function createProductForProvider(
  proveedorId: string,
  productData: unknown,
  precio: string,
  cantidad: string
): Promise<ActionResult<{ id: string; nombre: string; unidadId: string; unidad: string }>> {
  const parsed = createProductInputSchema.safeParse({
    proveedorId,
    productData,
    precio,
    cantidad,
  });
  if (!parsed.success) return unknownActionError(parsed.error);

  try {
    const provider = await getProvider(parsed.data.proveedorId);
    if (!provider) return actionError("Proveedor no encontrado.");
    if (provider.tipo !== "producto") {
      return actionError("Solo se pueden agregar productos a proveedores de productos.");
    }

    const unidad = await getUnidadOrThrow(parsed.data.productData.unidadId);
    const productId = randomUUID();
    const product = {
      id: productId,
      nombre: parsed.data.productData.nombre,
      descripcion: parsed.data.productData.descripcion,
      unidadId: unidad.id,
      unidad: unidad.codigo,
    };

    await db.batch([
      db.insert(productos).values(product),
      db.insert(proveedorProductos).values({
        proveedorId: parsed.data.proveedorId,
        productoId: productId,
        precio: parsed.data.precio,
        cantidad: parsed.data.cantidad,
      }),
      db.insert(historialPrecios).values({
        productoId: productId,
        proveedorId: parsed.data.proveedorId,
        precio: parsed.data.precio,
        unidadId: unidad.id,
      }),
    ]);

    revalidatePath(`/providers/${parsed.data.proveedorId}`);
    return actionOk({
      id: product.id,
      nombre: product.nombre,
      unidadId: unidad.id,
      unidad: unidad.codigo,
    });
  } catch (error) {
    return unknownActionError(error);
  }
}

export async function updateProductPrice(
  proveedorId: string,
  productoId: string,
  precio: string
): Promise<ActionResult> {
  const parsed = productProviderInputSchema.extend({ precio: moneySchema }).safeParse({
    proveedorId,
    productoId,
    precio,
  });
  if (!parsed.success) return unknownActionError(parsed.error);

  try {
    const [producto] = await db
      .select({ unidadId: productos.unidadId })
      .from(productos)
      .where(eq(productos.id, parsed.data.productoId));

    if (!producto?.unidadId) return actionError("Producto no encontrado.");

    const [updated] = await db
      .update(proveedorProductos)
      .set({ precio: parsed.data.precio, updatedAt: new Date() })
      .where(
        and(
          eq(proveedorProductos.proveedorId, parsed.data.proveedorId),
          eq(proveedorProductos.productoId, parsed.data.productoId)
        )
      )
      .returning({ productoId: proveedorProductos.productoId });

    if (!updated) return actionError("Producto no encontrado para este proveedor.");

    await recordPriceChange({
      productoId: parsed.data.productoId,
      proveedorId: parsed.data.proveedorId,
      precio: parsed.data.precio,
      unidadId: producto.unidadId,
    });

    revalidatePath(`/providers/${parsed.data.proveedorId}`);
    return actionOk(undefined);
  } catch (error) {
    return unknownActionError(error);
  }
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
  data: unknown
): Promise<ActionResult> {
  const parsed = updateProductInputSchema.safeParse({ proveedorId, productoId, data });
  if (!parsed.success) return unknownActionError(parsed.error);

  try {
    const unidad = await getUnidadOrThrow(parsed.data.data.unidadId);

    const [existing] = await db
      .select({ productoId: proveedorProductos.productoId })
      .from(proveedorProductos)
      .where(
        and(
          eq(proveedorProductos.proveedorId, parsed.data.proveedorId),
          eq(proveedorProductos.productoId, parsed.data.productoId)
        )
      );

    if (!existing) return actionError("Producto no encontrado para este proveedor.");

    await db.batch([
      db
        .update(productos)
        .set({
          nombre: parsed.data.data.nombre,
          unidadId: unidad.id,
          unidad: unidad.codigo,
          updatedAt: new Date(),
        })
        .where(eq(productos.id, parsed.data.productoId)),
      db
        .update(proveedorProductos)
        .set({ precio: parsed.data.data.precio, updatedAt: new Date() })
        .where(
          and(
            eq(proveedorProductos.proveedorId, parsed.data.proveedorId),
            eq(proveedorProductos.productoId, parsed.data.productoId)
          )
        ),
      db.insert(historialPrecios).values({
        productoId: parsed.data.productoId,
        proveedorId: parsed.data.proveedorId,
        precio: parsed.data.data.precio,
        unidadId: unidad.id,
      }),
    ]);

    revalidatePath(`/providers/${parsed.data.proveedorId}`);
    revalidatePath(`/providers/${parsed.data.proveedorId}/products/${parsed.data.productoId}`);
    return actionOk(undefined);
  } catch (error) {
    return unknownActionError(error);
  }
}

export async function removeProductFromProvider(
  proveedorId: string,
  productoId: string
): Promise<ActionResult> {
  const parsed = productProviderInputSchema.safeParse({ proveedorId, productoId });
  if (!parsed.success) return unknownActionError(parsed.error);

  try {
    const [invoiceLines, priceHistory, recipeUses] = await Promise.all([
      countRows(facturaLineas, eq(facturaLineas.productoId, parsed.data.productoId)),
      countRows(historialPrecios, eq(historialPrecios.productoId, parsed.data.productoId)),
      countRows(recetaProductos, eq(recetaProductos.productoId, parsed.data.productoId)),
    ]);

    const blockMessage = getProductDeleteBlock({
      invoiceLines,
      priceHistory,
      recipes: recipeUses,
    });
    if (blockMessage) return actionError(blockMessage);

    await db.batch([
      db
        .delete(proveedorProductos)
        .where(
          and(
            eq(proveedorProductos.proveedorId, parsed.data.proveedorId),
            eq(proveedorProductos.productoId, parsed.data.productoId)
          )
        ),
      db.delete(productos).where(eq(productos.id, parsed.data.productoId)),
    ]);

    revalidatePath(`/providers/${parsed.data.proveedorId}`);
    return actionOk(undefined);
  } catch (error) {
    return unknownActionError(error);
  }
}

async function getUnidadOrThrow(unidadId: string) {
  const [unidad] = await db
    .select({ id: unidades.id, codigo: unidades.codigo })
    .from(unidades)
    .where(eq(unidades.id, unidadId));
  if (!unidad) throw expectedActionError("Seleccioná una unidad válida.");
  return unidad;
}

async function recordPriceChange(args: {
  productoId: string;
  proveedorId: string;
  precio: string;
  unidadId: string;
  facturaId?: string;
}) {
  await db.insert(historialPrecios).values(args);
}

async function countRows(table: PgTable, where: SQL | undefined) {
  const [row] = await db.select({ value: count() }).from(table).where(where);
  return row?.value ?? 0;
}
