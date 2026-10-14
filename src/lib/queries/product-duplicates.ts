import "server-only";

import { sql } from "drizzle-orm";

import { db } from "@/db";
import { products } from "@/db/schema";
import { requireAccess } from "@/lib/auth/access";
import type { DuplicateProduct } from "@/lib/product-duplicates";

export async function getDuplicateProducts(): Promise<DuplicateProduct[]> {
  await requireAccess("main");
  const rows = await db.select({
    id: products.id, name: products.name, unit: products.unit, deletedAt: products.deletedAt, createdAt: products.createdAt,
    providers: sql<DuplicateProduct["providers"]>`coalesce((select json_agg(json_build_object('id', pr.id, 'name', pr.nombre, 'price', pp.precio::text) order by pr.nombre) from proveedor_productos pp join proveedores pr on pr.id = pp.proveedor_id where pp.producto_id = productos.id), '[]'::json)`,
    placements: sql<DuplicateProduct["placements"]>`coalesce((select json_agg(json_build_object('number', h.numero, 'note', hp.nota, 'active', hp.activo and h.activa) order by h.numero) from heladera_productos hp join heladeras h on h.id = hp.heladera_id where hp.producto_id = productos.id), '[]'::json)`,
    observations: sql<number>`(select count(*)::int from observaciones_inventario o where o.producto_id = productos.id) + (select count(*)::int from observaciones_bebidas o join inventario_bebidas_productos b on b.id = o.item_id where b.producto_id = productos.id)`,
    invoices: sql<number>`(select count(*)::int from factura_lineas l where l.producto_id = productos.id)`,
    latestCounts: sql<NonNullable<DuplicateProduct["latestCounts"]>>`coalesce((select json_agg(json_build_object('number', h.numero, 'quantity', latest.cantidad::text, 'unit', latest.unidad, 'recordedAt', latest.registrado_at) order by h.numero) from (select distinct on (o.heladera_id) o.heladera_id, o.cantidad, o.unidad, o.registrado_at from observaciones_inventario o where o.producto_id = productos.id order by o.heladera_id, o.registrado_at desc, o.id desc) latest join heladeras h on h.id = latest.heladera_id), '[]'::json)`,
  }).from(products).orderBy(products.name);
  return rows.map(row => ({ ...row, deletedAt: row.deletedAt?.toISOString() ?? null, createdAt: row.createdAt.toISOString() }));
}
