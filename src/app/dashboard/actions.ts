"use server";

import { getProductPriceHistory } from "@/lib/queries/invoices";
import type { PriceHistoryRow } from "@/lib/types/invoices";

/**
 * Server-action wrapper so the client tree can load a product's price history
 * on demand — `getProductPriceHistory` itself is a `server-only` query.
 */
export async function fetchProductPriceHistory(
  productId: string,
  providerId: string
): Promise<PriceHistoryRow[]> {
  return getProductPriceHistory(productId, { providerId });
}
