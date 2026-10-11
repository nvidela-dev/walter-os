"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { fridgeProducts, fridges, productMatches, products, providerProducts } from "@/db/schema";
import { actionError, actionOk, type ActionResult, unknownActionError } from "@/lib/action-result";
import { requireAccess } from "@/lib/auth/access";
import { uuidSchema } from "@/lib/validation";

export async function reviewProductMatch(input: unknown): Promise<ActionResult> {
  const userId = await requireAccess("main");
  try {
    const data = z.object({ inventoryId: uuidSchema, catalogueId: uuidSchema, status: z.enum(["accepted", "rejected"]) }).parse(input);
    const [source, target] = await Promise.all([
      db.select({ id: fridgeProducts.productId }).from(fridgeProducts).innerJoin(products, and(eq(products.id, fridgeProducts.productId), isNull(products.deletedAt))).innerJoin(fridges, eq(fridges.id, fridgeProducts.fridgeId))
        .where(and(eq(fridgeProducts.productId, data.inventoryId), eq(fridgeProducts.active, true), eq(fridges.active, true))).limit(1),
      db.select({ id: providerProducts.productId }).from(providerProducts).innerJoin(products, and(eq(products.id, providerProducts.productId), isNull(products.deletedAt))).where(eq(providerProducts.productId, data.catalogueId)).limit(1),
    ]);
    if (!source.length || !target.length) return actionError("Uno de los productos ya no está disponible. Actualizá la página.");
    await db.insert(productMatches).values({ ...data, reviewedBy: userId }).onConflictDoUpdate({
      target: [productMatches.inventoryId, productMatches.catalogueId],
      set: { status: data.status, reviewedBy: userId, reviewedAt: new Date() },
    });
    revalidatePath("/product-matching");
    return actionOk(undefined);
  } catch (error) { return unknownActionError(error); }
}

/** Global canonical-product archive. Placements, links and history remain untouched. */
export async function setProductArchived(input: unknown): Promise<ActionResult> {
  const userId = await requireAccess("main");
  try {
    const data = z.object({ productId: uuidSchema, archived: z.boolean() }).parse(input);
    const result = await db.update(products).set({ deletedAt: data.archived ? new Date() : null, deletedBy: data.archived ? userId : null, updatedAt: new Date() })
      .where(eq(products.id, data.productId)).returning({ id: products.id });
    if (result.length === 0) return actionError("Producto no encontrado.");
    revalidatePath("/", "layout");
    return actionOk(undefined);
  } catch (error) { return unknownActionError(error); }
}
