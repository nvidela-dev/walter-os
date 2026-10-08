export interface InventoryProgressCounts { counted: number; total: number }

/** A zero quantity is a count. Empty catalogues are not reported as completed. */
export function inventoryProgress(rows: { current: { quantity: string } | null }[]): InventoryProgressCounts {
  return { counted: rows.filter((row) => row.current !== null).length, total: rows.length };
}
