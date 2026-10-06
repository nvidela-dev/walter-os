import "server-only";

import { desc, eq, inArray, lt, sql } from "drizzle-orm";

import { db } from "@/db";
import { inventoryRunEntries, inventoryRuns } from "@/db/schema";
import { requireAccess } from "@/lib/auth/access";

export type RunEntry = typeof inventoryRunEntries.$inferSelect;
export interface InventoryRun {
  id: number; day: string; initial: boolean; entries: RunEntry[];
}

export async function getInventoryRuns(page = 1): Promise<{ runs: InventoryRun[]; hasNext: boolean }> {
  await requireAccess("inventory");
  if (!Number.isSafeInteger(page) || page < 1 || page > 1000000) throw new Error("Invalid run page");
  const headers = await db.select({ id: inventoryRuns.id, day: inventoryRuns.day,
    initial: sql<boolean>`NOT EXISTS (SELECT 1 FROM inventarios previous WHERE previous.fecha < ${inventoryRuns.day})`,
  }).from(inventoryRuns).orderBy(desc(inventoryRuns.day)).limit(11).offset((page - 1) * 10);
  const selected = headers.slice(0, 10);
  if (selected.length === 0) return { runs: [], hasNext: false };
  const entries = await db.select().from(inventoryRunEntries).where(inArray(inventoryRunEntries.runId, selected.map((run) => run.id))).orderBy(inventoryRunEntries.fridgeNumber, inventoryRunEntries.name);
  return { runs: selected.map((run) => ({ ...run, entries: entries.filter((entry) => entry.runId === run.id) })), hasNext: headers.length > 10 };
}

export async function getPreviousRunEntries(day: string): Promise<RunEntry[]> {
  await requireAccess("inventory");
  const [run] = await db.select().from(inventoryRuns).where(lt(inventoryRuns.day, day)).orderBy(desc(inventoryRuns.day)).limit(1);
  if (run == null) return [];
  return db.select().from(inventoryRunEntries).where(eq(inventoryRunEntries.runId, run.id));
}

export async function getLatestInventoryRun(): Promise<InventoryRun | null> {
  await requireAccess("inventory");
  const [run] = await db.select().from(inventoryRuns).orderBy(desc(inventoryRuns.day)).limit(1);
  if (run == null) return null;
  const [previous] = await db.select({ id: inventoryRuns.id }).from(inventoryRuns).where(lt(inventoryRuns.day, run.day)).limit(1);
  const entries = await db.select().from(inventoryRunEntries).where(eq(inventoryRunEntries.runId, run.id));
  return { ...run, initial: previous == null, entries };
}
