"use server";

import { randomUUID } from "node:crypto";
import { db } from "@/db";
import {
  facturas,
  facturaLineas,
  historialPrecios,
  proveedorProductos,
  proveedores,
  productos,
  unidades,
  type ProveedorTipo,
} from "@/db/schema";
import { and, asc, desc, eq, gt, ne, notExists, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface CreateFacturaInput {
  proveedorId: string;
  fecha: string; // YYYY-MM-DD
  numero?: string | null;
  notas?: string | null;
  lineas: Array<{
    productoId: string;
    unidadId: string;
    precioUnit: string;
    cantidad: string;
  }>;
}

export async function getFacturaFormData() {
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

  const grouped = new Map<
    string,
    {
      id: string;
      nombre: string;
      tipo: ProveedorTipo;
      productos: Array<{
        id: string;
        nombre: string;
        unidadId: string;
        unidadCodigo: string;
        precioActual: string;
      }>;
    }
  >();

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
    // A left-joined row with no product row means the provider has no catalog yet.
    if (!r.productoId || !r.unidadId || !r.productoNombre || !r.unidadCodigo || r.precioActual === null) {
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

export async function getFacturas() {
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

export async function getFactura(id: string) {
  const [header] = await db
    .select({
      id: facturas.id,
      proveedorId: facturas.proveedorId,
      proveedorNombre: proveedores.nombre,
      fecha: facturas.fecha,
      numero: facturas.numero,
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
) {
  const conditions = [eq(historialPrecios.productoId, productoId)];
  if (opts?.proveedorId) {
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

export async function createFactura(input: CreateFacturaInput) {
  if (input.lineas.length === 0) {
    throw new Error("Factura must have at least one line");
  }

  const facturaId = randomUUID();

  // Server-side total computation. Never trust client.
  const lineasWithTotals = input.lineas.map((l) => ({
    ...l,
    total: (Number(l.precioUnit) * Number(l.cantidad)).toFixed(2),
  }));
  const facturaTotal = lineasWithTotals
    .reduce((sum, l) => sum + Number(l.total), 0)
    .toFixed(2);

  // Dedupe lines by producto — if a factura has two lines for the same product,
  // the last one wins for the "current price" cache.
  const latestPerProduct = new Map<string, string>();
  for (const l of lineasWithTotals) {
    latestPerProduct.set(l.productoId, l.precioUnit);
  }

  const insertFactura = db.insert(facturas).values({
    id: facturaId,
    proveedorId: input.proveedorId,
    fecha: input.fecha,
    numero: input.numero ?? null,
    notas: input.notas ?? null,
    total: facturaTotal,
  });

  const insertLineas = db.insert(facturaLineas).values(
    lineasWithTotals.map((l) => ({
      facturaId,
      productoId: l.productoId,
      unidadId: l.unidadId,
      precioUnit: l.precioUnit,
      cantidad: l.cantidad,
      total: l.total,
    }))
  );

  const insertHistory = db.insert(historialPrecios).values(
    lineasWithTotals.map((l) => ({
      productoId: l.productoId,
      proveedorId: input.proveedorId,
      precio: l.precioUnit,
      unidadId: l.unidadId,
      facturaId,
    }))
  );

  // Conditional cache update: only refresh proveedor_productos.precio when no
  // later-dated factura already exists for this (proveedor, producto). Prevents
  // backdated invoices from clobbering the current price.
  const priceUpdates = [...latestPerProduct.entries()].map(([productoId, precio]) =>
    db
      .update(proveedorProductos)
      .set({ precio, updatedAt: new Date() })
      .where(
        and(
          eq(proveedorProductos.proveedorId, input.proveedorId),
          eq(proveedorProductos.productoId, productoId),
          notExists(
            db
              .select({ one: sql`1` })
              .from(facturas)
              .innerJoin(facturaLineas, eq(facturaLineas.facturaId, facturas.id))
              .where(
                and(
                  eq(facturas.proveedorId, input.proveedorId),
                  eq(facturaLineas.productoId, productoId),
                  gt(facturas.fecha, input.fecha),
                  ne(facturas.id, facturaId)
                )
              )
          )
        )
      )
  );

  await db.batch([insertFactura, insertLineas, insertHistory, ...priceUpdates]);

  revalidatePath("/facturas");
  revalidatePath(`/providers/${input.proveedorId}`);

  return { id: facturaId };
}

export async function togglePaid(id: string) {
  const [updated] = await db
    .update(facturas)
    .set({ paid: sql`NOT ${facturas.paid}`, updatedAt: new Date() })
    .where(eq(facturas.id, id))
    .returning({ paid: facturas.paid });

  if (!updated) throw new Error(`Factura not found: ${id}`);

  revalidatePath("/facturas");
  revalidatePath(`/facturas/${id}`);
  return updated.paid;
}

export async function deleteFactura(id: string) {
  // Lineas cascade via FK. historial_precios.factura_id is SET NULL —
  // the price history is preserved, just disconnected from the deleted invoice.
  const [deleted] = await db
    .delete(facturas)
    .where(eq(facturas.id, id))
    .returning({ proveedorId: facturas.proveedorId });

  if (!deleted) throw new Error(`Factura not found: ${id}`);

  revalidatePath("/facturas");
  revalidatePath(`/providers/${deleted.proveedorId}`);
}
