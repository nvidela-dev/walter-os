"use server";

import { randomUUID } from "node:crypto";

import { and, asc, count, desc, eq, gt, inArray, ne, notExists, type SQL,sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import {
  facturaLineas,
  facturas,
  historialPrecios,
  productos,
  proveedores,
  proveedorProductos,
  type ProveedorTipo,
  unidades,
} from "@/db/schema";
import {
  actionError,
  actionOk,
  type ActionResult,
  expectedActionError,
  unknownActionError,
} from "@/lib/action-result";
import { getFacturaDeleteBlock } from "@/lib/delete-guards";
import { multiplyDecimalStrings, sumDecimalStrings } from "@/lib/money";
import {
  isoDateSchema,
  moneySchema,
  optionalTextSchema,
  quantitySchema,
  uuidSchema,
} from "@/lib/validation";

const facturaBaseSchema = z.object({
  proveedorId: uuidSchema,
  fecha: isoDateSchema,
  numero: optionalTextSchema,
  notas: optionalTextSchema,
});

const facturaProductoSchema = facturaBaseSchema.extend({
  lineas: z
    .array(
      z.object({
        productoId: uuidSchema,
        precioUnit: moneySchema,
        cantidad: quantitySchema,
      })
    )
    .min(1, "Agregá al menos una línea."),
  monto: z.never().optional(),
});

const facturaServicioSchema = facturaBaseSchema.extend({
  monto: moneySchema,
  lineas: z.never().optional(),
});

const createFacturaSchema = z.union([facturaProductoSchema, facturaServicioSchema]);

export type CreateFacturaInput = z.input<typeof createFacturaSchema>;

export interface FacturaFormProduct {
  id: string;
  nombre: string;
  unidadId: string;
  unidadCodigo: string;
  precioActual: string;
}

export interface FacturaFormProveedor {
  id: string;
  nombre: string;
  tipo: ProveedorTipo;
  productos: FacturaFormProduct[];
}

export interface FacturaListRow {
  id: string;
  proveedorId: string;
  proveedorNombre: string;
  fecha: string;
  numero: string | null;
  total: string;
  paid: boolean;
}

export interface FacturaLineDetail {
  id: string;
  productoId: string;
  productoNombre: string;
  unidadId: string;
  unidad: string;
  unidadNombre: string;
  precioUnit: string;
  cantidad: string;
  total: string;
}

export interface FacturaDetail {
  id: string;
  proveedorId: string;
  proveedorNombre: string;
  fecha: string;
  numero: string | null;
  monto: string | null;
  total: string;
  paid: boolean;
  notas: string | null;
  createdAt: Date;
  lineas: FacturaLineDetail[];
}

export interface PriceHistoryRow {
  id: string;
  proveedorId: string;
  proveedorNombre: string;
  precio: string;
  unidad: string;
  facturaId: string | null;
  facturaNumero: string | null;
  facturaFecha: string | null;
  createdAt: Date;
}

export async function getFacturaFormData(): Promise<FacturaFormProveedor[]> {
  const rows = await db
    .select({
      proveedorId: proveedores.id,
      proveedorNombre: proveedores.nombre,
      proveedorTipo: proveedores.tipo,
      productoId: productos.id,
      productoNombre: productos.nombre,
      unidadId: productos.unidadId,
      unidadCodigo: unidades.codigo,
      precioActual: proveedorProductos.precio,
    })
    .from(proveedores)
    .leftJoin(proveedorProductos, eq(proveedorProductos.proveedorId, proveedores.id))
    .leftJoin(productos, eq(proveedorProductos.productoId, productos.id))
    .leftJoin(unidades, eq(productos.unidadId, unidades.id))
    .orderBy(asc(proveedores.nombre), asc(productos.nombre));

  const grouped = new Map<string, FacturaFormProveedor>();

  for (const r of rows) {
    let entry = grouped.get(r.proveedorId);
    if (!entry) {
      entry = {
        id: r.proveedorId,
        nombre: r.proveedorNombre,
        tipo: r.proveedorTipo,
        productos: [],
      };
      grouped.set(r.proveedorId, entry);
    }
    if (
      r.productoId == null ||
      r.unidadId == null ||
      r.productoNombre == null ||
      r.unidadCodigo == null ||
      r.precioActual === null
    ) {
      continue;
    }
    entry.productos.push({
      id: r.productoId,
      nombre: r.productoNombre,
      unidadId: r.unidadId,
      unidadCodigo: r.unidadCodigo,
      precioActual: r.precioActual,
    });
  }

  return [...grouped.values()];
}

export async function getFacturas(): Promise<FacturaListRow[]> {
  return db
    .select({
      id: facturas.id,
      proveedorId: facturas.proveedorId,
      proveedorNombre: proveedores.nombre,
      fecha: facturas.fecha,
      numero: facturas.numero,
      total: facturas.total,
      paid: facturas.paid,
    })
    .from(facturas)
    .innerJoin(proveedores, eq(facturas.proveedorId, proveedores.id))
    .orderBy(desc(facturas.fecha), desc(facturas.createdAt));
}

export async function getFactura(id: string): Promise<FacturaDetail | null> {
  const [header] = await db
    .select({
      id: facturas.id,
      proveedorId: facturas.proveedorId,
      proveedorNombre: proveedores.nombre,
      fecha: facturas.fecha,
      numero: facturas.numero,
      monto: facturas.monto,
      total: facturas.total,
      paid: facturas.paid,
      notas: facturas.notas,
      createdAt: facturas.createdAt,
    })
    .from(facturas)
    .innerJoin(proveedores, eq(facturas.proveedorId, proveedores.id))
    .where(eq(facturas.id, id));

  if (!header) return null;

  const lineas = await db
    .select({
      id: facturaLineas.id,
      productoId: facturaLineas.productoId,
      productoNombre: productos.nombre,
      unidadId: facturaLineas.unidadId,
      unidad: unidades.codigo,
      unidadNombre: unidades.nombre,
      precioUnit: facturaLineas.precioUnit,
      cantidad: facturaLineas.cantidad,
      total: facturaLineas.total,
    })
    .from(facturaLineas)
    .innerJoin(productos, eq(facturaLineas.productoId, productos.id))
    .innerJoin(unidades, eq(facturaLineas.unidadId, unidades.id))
    .where(eq(facturaLineas.facturaId, id))
    .orderBy(facturaLineas.createdAt);

  return { ...header, lineas };
}

export async function getProductPriceHistory(
  productoId: string,
  opts?: { proveedorId?: string }
): Promise<PriceHistoryRow[]> {
  const conditions = [eq(historialPrecios.productoId, productoId)];
  if (opts?.proveedorId != null) {
    conditions.push(eq(historialPrecios.proveedorId, opts.proveedorId));
  }

  return db
    .select({
      id: historialPrecios.id,
      proveedorId: historialPrecios.proveedorId,
      proveedorNombre: proveedores.nombre,
      precio: historialPrecios.precio,
      unidad: unidades.codigo,
      facturaId: historialPrecios.facturaId,
      facturaNumero: facturas.numero,
      facturaFecha: facturas.fecha,
      createdAt: historialPrecios.createdAt,
    })
    .from(historialPrecios)
    .innerJoin(proveedores, eq(historialPrecios.proveedorId, proveedores.id))
    .innerJoin(unidades, eq(historialPrecios.unidadId, unidades.id))
    .leftJoin(facturas, eq(historialPrecios.facturaId, facturas.id))
    .where(and(...conditions))
    .orderBy(desc(historialPrecios.createdAt));
}

export async function createFactura(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = createFacturaSchema.safeParse(input);
  if (!parsed.success) return unknownActionError(parsed.error);

  try {
    const provider = await getProviderForFactura(parsed.data.proveedorId);
    if (!provider) return actionError("Proveedor no encontrado.");

    const facturaId = randomUUID();

    if ("monto" in parsed.data && parsed.data.monto !== undefined) {
      if (provider.tipo !== "servicio") {
        return actionError("Las facturas de servicio requieren un proveedor de servicios.");
      }

      await db.insert(facturas).values({
        id: facturaId,
        proveedorId: parsed.data.proveedorId,
        fecha: parsed.data.fecha,
        numero: parsed.data.numero,
        notas: parsed.data.notas,
        monto: parsed.data.monto,
        total: parsed.data.monto,
      });

      revalidateFacturaPaths(parsed.data.proveedorId);
      return actionOk({ id: facturaId });
    }

    if (provider.tipo !== "producto") {
      return actionError("Las facturas de productos requieren un proveedor de productos.");
    }

    const productIds = [...new Set(parsed.data.lineas.map((linea) => linea.productoId))];
    const catalogRows = await db
      .select({
        productoId: proveedorProductos.productoId,
        unidadId: productos.unidadId,
        nombre: productos.nombre,
      })
      .from(proveedorProductos)
      .innerJoin(productos, eq(proveedorProductos.productoId, productos.id))
      .where(
        and(
          eq(proveedorProductos.proveedorId, parsed.data.proveedorId),
          inArray(proveedorProductos.productoId, productIds)
        )
      );

    const productById = new Map(catalogRows.map((row) => [row.productoId, row]));

    const lineasWithTotals = parsed.data.lineas.map((linea) => {
      const product = productById.get(linea.productoId);
      if (product?.unidadId == null) {
        throw expectedActionError(
          "La factura incluye un producto que no pertenece a este proveedor."
        );
      }
      return {
        ...linea,
        unidadId: product.unidadId,
        total: multiplyDecimalStrings(linea.precioUnit, linea.cantidad),
      };
    });

    const facturaTotal = sumDecimalStrings(lineasWithTotals.map((linea) => linea.total));

    const latestPerProduct = new Map<string, string>();
    for (const linea of lineasWithTotals) {
      latestPerProduct.set(linea.productoId, linea.precioUnit);
    }

    const insertFactura = db.insert(facturas).values({
      id: facturaId,
      proveedorId: parsed.data.proveedorId,
      fecha: parsed.data.fecha,
      numero: parsed.data.numero,
      notas: parsed.data.notas,
      total: facturaTotal,
    });

    const insertLineas = db.insert(facturaLineas).values(
      lineasWithTotals.map((linea) => ({
        facturaId,
        productoId: linea.productoId,
        unidadId: linea.unidadId,
        precioUnit: linea.precioUnit,
        cantidad: linea.cantidad,
        total: linea.total,
      }))
    );

    const insertHistory = db.insert(historialPrecios).values(
      lineasWithTotals.map((linea) => ({
        productoId: linea.productoId,
        proveedorId: parsed.data.proveedorId,
        precio: linea.precioUnit,
        unidadId: linea.unidadId,
        facturaId,
      }))
    );

    const priceUpdates = [...latestPerProduct.entries()].map(([productoId, precio]) =>
      db
        .update(proveedorProductos)
        .set({ precio, updatedAt: new Date() })
        .where(
          and(
            eq(proveedorProductos.proveedorId, parsed.data.proveedorId),
            eq(proveedorProductos.productoId, productoId),
            notExists(
              db
                .select({ one: sql`1` })
                .from(facturas)
                .innerJoin(facturaLineas, eq(facturaLineas.facturaId, facturas.id))
                .where(
                  and(
                    eq(facturas.proveedorId, parsed.data.proveedorId),
                    eq(facturaLineas.productoId, productoId),
                    gt(facturas.fecha, parsed.data.fecha),
                    ne(facturas.id, facturaId)
                  )
                )
            )
          )
        )
    );

    await db.batch([insertFactura, insertLineas, insertHistory, ...priceUpdates]);

    revalidateFacturaPaths(parsed.data.proveedorId);
    return actionOk({ id: facturaId });
  } catch (error) {
    return unknownActionError(error);
  }
}

export async function togglePaid(id: string): Promise<ActionResult<{ paid: boolean }>> {
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) return unknownActionError(parsedId.error);

  try {
    const [updated] = await db
      .update(facturas)
      .set({ paid: sql`NOT ${facturas.paid}`, updatedAt: new Date() })
      .where(eq(facturas.id, parsedId.data))
      .returning({ paid: facturas.paid });

    if (!updated) return actionError("Factura no encontrada.");

    revalidatePath("/facturas");
    revalidatePath(`/facturas/${parsedId.data}`);
    return actionOk(updated);
  } catch (error) {
    return unknownActionError(error);
  }
}

export async function deleteFactura(id: string): Promise<ActionResult> {
  const parsedId = uuidSchema.safeParse(id);
  if (!parsedId.success) return unknownActionError(parsedId.error);

  try {
    const [lineas, history] = await Promise.all([
      countRows(facturaLineas, eq(facturaLineas.facturaId, parsedId.data)),
      countRows(historialPrecios, eq(historialPrecios.facturaId, parsedId.data)),
    ]);

    const blockMessage = getFacturaDeleteBlock({ lines: lineas, priceHistory: history });
    if (blockMessage != null) return actionError(blockMessage);

    const [deleted] = await db
      .delete(facturas)
      .where(eq(facturas.id, parsedId.data))
      .returning({ proveedorId: facturas.proveedorId });

    if (!deleted) return actionError("Factura no encontrada.");

    revalidateFacturaPaths(deleted.proveedorId);
    return actionOk(undefined);
  } catch (error) {
    return unknownActionError(error);
  }
}

async function getProviderForFactura(
  id: string
): Promise<{ id: string; tipo: ProveedorTipo } | null> {
  const [provider] = await db
    .select({ id: proveedores.id, tipo: proveedores.tipo })
    .from(proveedores)
    .where(eq(proveedores.id, id));
  return provider ?? null;
}

function revalidateFacturaPaths(proveedorId: string): void {
  revalidatePath("/facturas");
  revalidatePath(`/providers/${proveedorId}`);
}

async function countRows(table: PgTable, where: SQL | undefined): Promise<number> {
  const [row] = await db.select({ value: count() }).from(table).where(where);
  return row?.value ?? 0;
}
