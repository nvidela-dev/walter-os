import Link from "next/link";
import type { ReactElement } from "react";

import { t } from "@/i18n";
import { getFridgeRunInventory, getFridges } from "@/lib/queries/inventory";
import { getInventoryItemSuggestions } from "@/lib/queries/inventory-items";

import { ItemSearch } from "../item-search";
import { InventoryList } from "./list";

export const dynamic = "force-dynamic";

export default async function InventoryListPage(): Promise<ReactElement> {
  const [fridges, items] = await Promise.all([getFridges(), getInventoryItemSuggestions()]);
  const groups = await Promise.all(fridges.map(async (fridge) => ({
    id: fridge.id, number: fridge.number, name: fridge.name, commentary: fridge.commentary, rows: await getFridgeRunInventory(fridge.id),
  })));
  return <main className="space-y-5">
    <Link href="/inventory" className="text-sm underline">← Heladeras</Link>
    <h1 className="text-3xl font-semibold">Último inventario</h1>
    <p className="text-sm text-muted">Cantidades del último inventario, agrupadas por heladera. Los cambios comparan con el inventario anterior.</p>
    <Link href="/inventory/purchases" className="block text-sm font-medium underline">{t.inventoryPurchases.title}</Link>
    <ItemSearch items={items} />
    <InventoryList groups={groups} />
  </main>;
}
