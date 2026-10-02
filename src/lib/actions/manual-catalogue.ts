"use server";

import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { fridgeProducts, fridges, products, units } from "@/db/schema";
import { actionError, actionOk, type ActionResult, unknownActionError } from "@/lib/action-result";
import { requireAccess } from "@/lib/auth/access";
import { requiredTextSchema, uuidSchema } from "@/lib/validation";

export async function getManualPhotos(): Promise<string[]> {
  await requireAccess("inventory");
  return Promise.all([1, 2].map(async (number) => {
    const bytes = await readFile(path.join(process.cwd(), "src/lib/inventory/photos", `page-${number}.jpg`));
    return `data:image/jpeg;base64,${bytes.toString("base64")}`;
  }));
}

export async function addManualCatalogue(input: unknown): Promise<ActionResult> {
  try {
    await requireAccess("inventory");
    const rows = z.array(z.object({ name: requiredTextSchema, fridgeId: uuidSchema, unitId: uuidSchema, productId: uuidSchema.nullable() })).min(1).max(200).parse(input);
    const fridgeIds = [...new Set(rows.map((row) => row.fridgeId))];
    const available = await db.select().from(fridges).where(and(inArray(fridges.id, fridgeIds), eq(fridges.active, true)));
    if (available.length !== fridgeIds.length) return actionError("Seleccioná una heladera activa.");
    const unitRows = await db.select().from(units);
    const catalogue = await db.select().from(products);
    const created = new Map<string, { id: string; name: string; unitId: string; unit: string }>();
    const links = new Map<string, { fridgeId: string; productId: string }>();
    for (const row of rows) {
      const unit = unitRows.find((item) => item.id === row.unitId);
      if (unit == null) return actionError("Confirmá una unidad válida.");
      let productId = row.productId;
      if (productId !== null) {
        const product = catalogue.find((item) => item.id === productId);
        if (product?.unitId !== unit.id) return actionError("Revisá el producto existente y su unidad.");
      } else {
        const key = row.name.toLocaleLowerCase();
        const matches = catalogue.filter((item) => item.name.trim().toLocaleLowerCase() === key);
        if (matches.length > 1) return actionError(`Hay varios productos llamados «${row.name}». Elegí uno.`);
        const existing = matches[0];
        const prior = created.get(key);
        if (existing != null) {
          if (existing.unitId !== unit.id) return actionError(`«${row.name}» ya existe con otra unidad.`);
          productId = existing.id;
        } else {
          if (prior != null && prior.unitId !== unit.id) return actionError(`«${row.name}» tiene unidades diferentes en el lote.`);
          productId = prior?.id ?? randomUUID();
          created.set(key, { id: productId, name: row.name, unitId: unit.id, unit: unit.code });
        }
      }
      links.set(`${row.fridgeId}:${productId}`, { fridgeId: row.fridgeId, productId });
    }
    const memberships = db.insert(fridgeProducts).values([...links.values()]).onConflictDoNothing();
    if (created.size > 0) await db.batch([db.insert(products).values([...created.values()]), memberships]);
    else await db.batch([memberships]);
    revalidatePath("/inventory", "layout");
    return actionOk(undefined);
  } catch (error) { return unknownActionError(error); }
}
