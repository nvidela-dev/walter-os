"use server";

import { randomUUID } from "node:crypto";

import { and, eq, inArray, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { fridgeProducts, fridges, inventoryObservations, inventoryRuns, products, units } from "@/db/schema";
import { t } from "@/i18n";
import { actionError, actionOk, type ActionResult, unknownActionError } from "@/lib/action-result";
import { requireAccess } from "@/lib/auth/access";
import { fridgeDetailsSchema, fridgeInputSchema, fridgeProductInputSchema, inventoryCountSchema, inventoryEntrySchema, inventoryProductInputSchema } from "@/lib/validators/inventory";

async function activeFridge(id: string): Promise<boolean> {
  const [row] = await db.select({ id: fridges.id }).from(fridges).where(and(eq(fridges.id, id), eq(fridges.active, true)));
  return row != null;
}

export async function createFridge(input: unknown): Promise<ActionResult> {
  try {
    await requireAccess("inventory");
    const data = fridgeInputSchema.parse(input);
    const rows = await db.insert(fridges).values(data).onConflictDoNothing().returning({ id: fridges.id });
    if (rows.length === 0) return actionError(t.inventory.duplicateFridge);
    revalidatePath("/inventory");
    return actionOk(undefined);
  } catch (error) { return unknownActionError(error); }
}

export async function addFridgeProduct(input: unknown): Promise<ActionResult> {
  try {
    await requireAccess("inventory");
    const data = fridgeProductInputSchema.parse(input);
    if (!(await activeFridge(data.fridgeId))) return actionError(t.inventory.invalidFridge);
    await db.insert(fridgeProducts).values(data).onConflictDoUpdate({ target: [fridgeProducts.fridgeId, fridgeProducts.productId], set: { active: true } });
    revalidatePath(`/inventory/${data.fridgeId}`);
    revalidatePath("/inventory/list");
    revalidatePath("/inventory/history");
    return actionOk(undefined);
  } catch (error) { return unknownActionError(error); }
}

export async function createInventoryProduct(input: unknown): Promise<ActionResult> {
  try {
    await requireAccess("inventory");
    const data = inventoryProductInputSchema.parse(input);
    if (!(await activeFridge(data.fridgeId))) return actionError(t.inventory.invalidFridge);
    const [unit] = await db.select().from(units).where(eq(units.id, data.unitId));
    if (!unit) return actionError(t.errors.product.selectValidUnit);
    const productId = randomUUID();
    await db.batch([
      db.insert(products).values({ id: productId, name: data.name, unitId: unit.id, unit: unit.code }),
      db.insert(fridgeProducts).values({ fridgeId: data.fridgeId, productId }),
    ]);
    revalidatePath(`/inventory/${data.fridgeId}`);
    revalidatePath("/inventory/list");
    revalidatePath("/inventory/history");
    return actionOk(undefined);
  } catch (error) { return unknownActionError(error); }
}

export async function saveInventory(input: unknown): Promise<ActionResult> {
  try {
    const userId = await requireAccess("inventory");
    const data = inventoryCountSchema.parse(input);
    if (!(await activeFridge(data.fridgeId))) return actionError(t.inventory.invalidFridge);
    const tracked = await db.select({ id: products.id, unit: products.unit }).from(fridgeProducts)
      .innerJoin(products, eq(products.id, fridgeProducts.productId))
      .where(and(eq(fridgeProducts.fridgeId, data.fridgeId), eq(fridgeProducts.active, true), inArray(products.id, data.counts.map((count) => count.productId))));
    if (tracked.length !== data.counts.length) return actionError(t.inventory.invalidItems);
    const observations = data.counts.map((count) => ({
      fridgeId: data.fridgeId, productId: count.productId, quantity: count.quantity,
      unit: tracked.find((product) => product.id === count.productId)?.unit ?? "", recordedBy: userId,
    }));
    // One INSERT is atomic; the database supplies a common timestamp for this save.
    await db.insert(inventoryObservations).values(observations);
    revalidatePath(`/inventory/${data.fridgeId}`);
    revalidatePath("/inventory/list");
    revalidatePath("/inventory/history");
    return actionOk(undefined);
  } catch (error) { return unknownActionError(error); }
}

export async function removeInventoryEntry(input: unknown): Promise<ActionResult> {
  try {
    await requireAccess("inventory");
    const data = fridgeProductInputSchema.parse(input);
    if (!(await activeFridge(data.fridgeId))) return actionError(t.inventory.invalidFridge);
    const result = await db.update(fridgeProducts).set({ active: false }).where(and(eq(fridgeProducts.fridgeId, data.fridgeId), eq(fridgeProducts.productId, data.productId))).returning({ id: fridgeProducts.productId });
    if (result.length === 0) return actionError(t.inventory.invalidItems);
    revalidatePath(`/inventory/${data.fridgeId}`);
    revalidatePath("/inventory/list");
    revalidatePath("/inventory/history");
    return actionOk(undefined);
  } catch (error) { return unknownActionError(error); }
}

export async function editInventoryEntry(input: unknown): Promise<ActionResult> {
  try {
    const userId = await requireAccess("inventory");
    const data = inventoryEntrySchema.parse(input);
    if (data.quantity !== null) {
      const [todayRun] = await db.select({ id: inventoryRuns.id }).from(inventoryRuns).where(eq(inventoryRuns.day, sql`public.inventory_week((now() AT TIME ZONE 'America/Montevideo')::date)`));
      if (todayRun == null) return actionError("Para registrar cantidades de un nuevo inventario, abrí Nuevo inventario.");
    }
    if (!(await activeFridge(data.fridgeId))) return actionError(t.inventory.invalidFridge);
    const condition = and(eq(fridgeProducts.fridgeId, data.fridgeId), eq(fridgeProducts.productId, data.productId), eq(fridgeProducts.active, true));
    const [product] = await db.select({ unit: products.unit }).from(fridgeProducts).innerJoin(products, eq(products.id, fridgeProducts.productId)).where(condition);
    if (product == null) return actionError(t.inventory.invalidItems);
    const update = db.update(fridgeProducts).set({ note: data.note }).where(condition);
    if (data.quantity === null) await update;
    else await db.batch([update, db.insert(inventoryObservations).values({ fridgeId: data.fridgeId, productId: data.productId, quantity: data.quantity, unit: product.unit, recordedBy: userId })]);
    revalidatePath(`/inventory/${data.fridgeId}`);
    revalidatePath("/inventory/list");
    revalidatePath("/inventory/history");
    return actionOk(undefined);
  } catch (error) { return unknownActionError(error); }
}

export async function updateFridgeDetails(input: unknown): Promise<ActionResult> {
  try {
    await requireAccess("inventory");
    const { fridgeId, number, name, commentary } = fridgeDetailsSchema.parse(input);
    const [duplicate] = await db.select({ id: fridges.id }).from(fridges).where(and(eq(fridges.number, number), ne(fridges.id, fridgeId)));
    if (duplicate != null) return actionError(t.inventory.duplicateFridge);
    const rows = await db.update(fridges).set({ number, name, commentary, updatedAt: new Date() }).where(and(eq(fridges.id, fridgeId), eq(fridges.active, true))).returning({ id: fridges.id });
    if (rows.length === 0) return actionError(t.inventory.invalidFridge);
    revalidatePath("/inventory", "layout");
    return actionOk(undefined);
  } catch (error) {
    // The unique database constraint also protects concurrent renumbering.
    const cause: unknown = error instanceof Error ? error.cause : null;
    if ((typeof error === "object" && error !== null && "code" in error && error.code === "23505") ||
      (typeof cause === "object" && cause !== null && "code" in cause && cause.code === "23505")) return actionError(t.inventory.duplicateFridge);
    return unknownActionError(error);
  }
}

export async function startInventoryRun(): Promise<ActionResult> {
  try {
    await requireAccess("inventory");
    await db.insert(inventoryRuns).values({ day: sql`public.inventory_week((now() AT TIME ZONE 'America/Montevideo')::date)` }).onConflictDoNothing();
    revalidatePath("/inventory", "layout");
    return actionOk(undefined);
  } catch (error) { return unknownActionError(error); }
}
