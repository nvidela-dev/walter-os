"use server";

import { randomUUID } from "node:crypto";

import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { drinkItems, drinkObservations, products, units } from "@/db/schema";
import { actionError, actionOk, type ActionResult, unknownActionError } from "@/lib/action-result";
import { requireAccess } from "@/lib/auth/access";
import { drinkActiveSchema, drinkCountsSchema, drinkItemSchema, drinkTargetSchema } from "@/lib/validators/drinks";

export async function createDrinkItem(input: unknown): Promise<ActionResult> {
  await requireAccess("main");
  try {
    const data = drinkItemSchema.parse(input);
    const [unit] = await db.select().from(units).where(eq(units.id, data.unitId));
    if (unit === undefined) return actionError("Elegí una unidad válida.");
    const matches = await db.select({ id: products.id, unit: products.unit, unitId: products.unitId }).from(products)
      .where(sql`lower(trim(${products.name})) = lower(${data.name})`);
    if (matches.length > 1) return actionError("Hay varios productos con ese nombre. Revisá el catálogo antes de agregarlo.");
    const existing = matches[0];
    if (existing !== undefined && existing.unitId !== unit.id) return actionError("Ese producto ya existe con otra unidad. Usá su unidad actual.");
    const productId = existing?.id ?? randomUUID();
    const placement = db.insert(drinkItems).values({ productId, location: data.location })
      .onConflictDoUpdate({ target: [drinkItems.productId, drinkItems.location], set: { active: true } });
    if (existing === undefined) await db.batch([
      db.insert(products).values({ id: productId, name: data.name, unitId: unit.id, unit: unit.code }),
      placement,
    ]);
    else await placement;
    revalidatePath("/drinks", "layout");
    revalidatePath("/data-fill");
    return actionOk(undefined);
  } catch (error) { return unknownActionError(error); }
}

export async function setDrinkTarget(input: unknown): Promise<ActionResult> {
  await requireAccess("main");
  try {
    const data = drinkTargetSchema.parse(input);
    const [item] = await db.select({ unit: products.unit }).from(drinkItems)
      .innerJoin(products, eq(products.id, drinkItems.productId))
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

export async function saveDrinkCounts(input: unknown): Promise<ActionResult> {
  const userId = await requireAccess("drinks");
  try {
    const data = drinkCountsSchema.parse(input);
    const rows = await db.select({ id: drinkItems.id, location: drinkItems.location, name: products.name, unit: products.unit })
      .from(drinkItems).innerJoin(products, eq(products.id, drinkItems.productId))
      .where(and(eq(drinkItems.active, true), inArray(drinkItems.id, data.map((row) => row.itemId))));
    if (rows.length !== data.length) return actionError("Hay bebidas que ya no están disponibles. Volvé a cargar la lista.");
    if (data.some((count) => rows.find((row) => row.id === count.itemId)?.unit !== count.unit)) {
      return actionError("La unidad de una bebida cambió. Volvé a cargar la lista antes de contar.");
    }
    await db.insert(drinkObservations).values(data.map((count) => {
      const item = rows.find((row) => row.id === count.itemId);
      if (item === undefined) throw new Error("Missing drink item");
      return { itemId: item.id, name: item.name, location: item.location, unit: item.unit, quantity: count.quantity, recordedBy: userId };
    }));
    revalidatePath("/drinks", "layout");
    return actionOk(undefined);
  } catch (error) { return unknownActionError(error); }
}
