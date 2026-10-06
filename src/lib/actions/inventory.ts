"use server";

import { randomUUID } from "node:crypto";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { fridgeProducts, fridges, inventoryObservations, products, units } from "@/db/schema";
import { t } from "@/i18n";
import { actionError, actionOk, type ActionResult, unknownActionError } from "@/lib/action-result";
import { requireAccess } from "@/lib/auth/access";
import { fridgeInputSchema, fridgeProductInputSchema, inventoryCountSchema, inventoryProductInputSchema } from "@/lib/validators/inventory";

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
    return actionOk(undefined);
  } catch (error) { return unknownActionError(error); }
}
