"use server";

import { randomUUID } from "node:crypto";

import { and, eq, isNull,sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { drinkItems, products, units } from "@/db/schema";
import { actionError, actionOk, type ActionResult, unknownActionError } from "@/lib/action-result";
import { requireAccess } from "@/lib/auth/access";
import { drinkActiveSchema, drinkItemSchema, drinkTargetSchema } from "@/lib/validators/drinks";

export async function createDrinkItem(input: unknown): Promise<ActionResult> {
  await requireAccess("main");
  return createDrink(input, true);
}

export async function addDrinkItem(input: unknown): Promise<ActionResult> {
  await requireAccess("drinks");
  return createDrink(input, false);
}

async function createDrink(input: unknown, allowUpdate: boolean): Promise<ActionResult> {
  try {
    const data = drinkItemSchema.parse(input);
    const [unit] = await db.select().from(units).where(eq(units.id, data.unitId));
    if (unit === undefined) return actionError("Elegí una unidad válida.");
    const matches = await db.select({ id: products.id, unit: products.unit, unitId: products.unitId }).from(products)
      .where(and(isNull(products.deletedAt), sql`lower(trim(${products.name})) = lower(${data.name})`));
    if (matches.length > 1) return actionError("Hay varios productos con ese nombre. Revisá el catálogo antes de agregarlo.");
    const existing = matches[0];
    if (existing !== undefined && existing.unitId !== unit.id) return actionError("Ese producto ya existe con otra unidad. Usá su unidad actual.");
    const productId = existing?.id ?? randomUUID();
    const insert = db.insert(drinkItems).values({ productId, location: data.location, category: data.category, countUnit: data.countUnit });
    // The staff add path never restores, recategorizes, or changes an existing drink.
    const placement = allowUpdate
      ? insert.onConflictDoUpdate({ target: [drinkItems.productId, drinkItems.location], set: { active: true, category: data.category, countUnit: data.countUnit } }).returning({ id: drinkItems.id })
      : insert.onConflictDoNothing().returning({ id: drinkItems.id });
    if (existing === undefined) await db.batch([
      db.insert(products).values({ id: productId, name: data.name, unitId: unit.id, unit: unit.code }),
      placement,
    ]);
    else {
      const added = await placement;
      if (added.length === 0) return actionError("Esta bebida ya está registrada en esa ubicación. Si está oculta, pedile a Admin que la restaure.");
    }
    revalidatePath("/drinks", "layout");
    revalidatePath("/data-fill");
    return actionOk(undefined);
  } catch (error) { return unknownActionError(error); }
}

export async function setDrinkTarget(input: unknown): Promise<ActionResult> {
  await requireAccess("main");
  try {
    const data = drinkTargetSchema.parse(input);
    const [item] = await db.select({ unit: sql<string>`coalesce(${drinkItems.countUnit}, ${products.unit})` }).from(drinkItems)
      .innerJoin(products, and(eq(products.id, drinkItems.productId), isNull(products.deletedAt)))
      .where(and(eq(drinkItems.id, data.itemId), eq(drinkItems.active, true)));
    if (item === undefined) return actionError("Esta bebida ya no está disponible.");
    await db.update(drinkItems).set({ targetQuantity: data.quantity, targetUnit: data.quantity === null ? null : item.unit })
      .where(eq(drinkItems.id, data.itemId));
    revalidatePath("/drinks", "layout");
    return actionOk(undefined);
  } catch (error) { return unknownActionError(error); }
}

export async function setDrinkActive(input: unknown): Promise<ActionResult> {
  await requireAccess("main");
  try {
    const data = drinkActiveSchema.parse(input);
    const rows = await db.update(drinkItems).set({ active: data.active }).where(eq(drinkItems.id, data.itemId)).returning({ id: drinkItems.id });
    if (rows.length === 0) return actionError("Bebida no encontrada.");
    revalidatePath("/drinks", "layout");
    return actionOk(undefined);
  } catch (error) { return unknownActionError(error); }
}

export async function saveDrinkCounts(_input: unknown, _category?: string): Promise<ActionResult> {
  await requireAccess("drinks");
  return actionError("Abrí un documento de inventario y elegí Editar para guardar los conteos.");
}
