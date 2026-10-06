import Link from "next/link";
import type { ReactElement } from "react";

import { getFridgeInventory, getFridges } from "@/lib/queries/inventory";

import { InventoryList } from "./list";

export const dynamic = "force-dynamic";

export default async function InventoryListPage(): Promise<ReactElement> {
  const fridges = await getFridges();
  const groups = await Promise.all(fridges.map(async (fridge) => ({
    id: fridge.id, number: fridge.number, name: fridge.name, rows: await getFridgeInventory(fridge.id),
  })));
  return <main className="space-y-5">
    <Link href="/inventory" className="text-sm underline">← Heladeras</Link>
    <h1 className="text-3xl font-semibold">Último inventario</h1>
    <p className="text-sm text-muted">Última cantidad guardada de cada producto, agrupada por heladera. Cada fecha indica cuándo se contó.</p>
    <InventoryList groups={groups} />
  </main>;
}
