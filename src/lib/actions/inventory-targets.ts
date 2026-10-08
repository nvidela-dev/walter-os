"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { inventoryTargetHistory } from "@/db/schema";
import { t } from "@/i18n";
import { actionError, actionOk, type ActionResult, unknownActionError } from "@/lib/action-result";
import { requireAccess } from "@/lib/auth/access";
import { getInventoryTargetProduct } from "@/lib/queries/inventory-targets";
import { inventoryTargetSchema } from "@/lib/validators/inventory-targets";

export async function setInventoryTarget(input: unknown): Promise<ActionResult> {
  try {
    // Target planning is Admin-only; Kitchen can read targets and count stock.
    const userId = await requireAccess("main");
    const data = inventoryTargetSchema.parse(input);
    const product = await getInventoryTargetProduct(data.productId);
    if (product === null) return actionError(t.inventory.invalidItems);
    // The insert trigger updates the single active pointer in this transaction.
    await db.insert(inventoryTargetHistory).values({ productId: product.id, quantity: data.quantity, unit: product.unit, recordedBy: userId });
    revalidatePath(`/inventory/items/${product.id}`);
    revalidatePath(`/inventory/items/${product.id}/targets`);
    revalidatePath("/inventory/purchases");
    return actionOk(undefined);
  } catch (error) { return unknownActionError(error); }
}
