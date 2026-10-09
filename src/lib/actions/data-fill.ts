"use server";

import { and, eq, notExists, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { products, providerProducts, providers } from "@/db/schema";
import { actionError, actionOk, type ActionResult, unknownActionError } from "@/lib/action-result";
import { requireAccess } from "@/lib/auth/access";
import { uuidSchema } from "@/lib/validation";

export async function assignProductProvider(input: unknown): Promise<ActionResult> {
  await requireAccess("main");
  try {
    const data = z.object({ productId: uuidSchema, providerId: uuidSchema }).parse(input);
    // One statement validates both identities and avoids overwriting an existing price.
    const inserted = await db.insert(providerProducts).select(
      db.select({
        providerId: providers.id,
        productId: products.id,
        price: sql<string | null>`NULL::numeric`.as("price"),
        quantity: sql<string>`1::numeric`.as("quantity"),
        createdAt: sql<Date>`now()`.as("created_at"),
        updatedAt: sql<Date>`now()`.as("updated_at"),
      }).from(products).innerJoin(providers, and(eq(providers.id, data.providerId), eq(providers.type, "producto")))
        .where(and(eq(products.id, data.productId),
          notExists(db.select().from(providerProducts).where(eq(providerProducts.productId, products.id)))))
    ).onConflictDoNothing().returning({ productId: providerProducts.productId });
    if (inserted.length === 0) return actionError("Este producto ya tiene proveedor o la selección ya no está disponible. Volvé a cargar para actualizar.");
    revalidatePath("/data-fill");
    revalidatePath("/providers");
    revalidatePath(`/providers/${data.providerId}`);
    revalidatePath("/inventory", "layout");
    revalidatePath("/invoices/new");
    return actionOk(undefined);
  } catch (error) { return unknownActionError(error); }
}
