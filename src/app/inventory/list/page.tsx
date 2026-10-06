import Link from "next/link";
import type { ReactElement } from "react";

import { getFridgeRunInventory, getFridges } from "@/lib/queries/inventory";
import { getLatestInventoryRun } from "@/lib/queries/inventory-runs";

import { RunControls } from "../run-controls";
import { InventoryList } from "./list";

export const dynamic = "force-dynamic";

export default async function InventoryListPage(): Promise<ReactElement> {
  const [fridges, run] = await Promise.all([getFridges(), getLatestInventoryRun()]);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Montevideo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const groups = await Promise.all(fridges.map(async (fridge) => ({
    id: fridge.id, number: fridge.number, name: fridge.name, commentary: fridge.commentary, rows: await getFridgeRunInventory(fridge.id),
  })));
  return <main className="space-y-5">
    <Link href="/inventory" className="text-sm underline">← Heladeras</Link>
    <h1 className="text-3xl font-semibold">Último inventario</h1>
    <p className="text-sm text-muted">Cantidades del último inventario, agrupadas por heladera. Los cambios comparan con el inventario anterior.</p>
    <RunControls day={run?.day ?? null} today={today} />
    <InventoryList groups={groups} />
  </main>;
}
