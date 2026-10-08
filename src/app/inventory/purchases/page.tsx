import Link from "next/link";
import type { ReactElement } from "react";

import { t } from "@/i18n";
import { inventoryWeek, runDate } from "@/lib/inventory/run-display";
import { getInventoryPurchases } from "@/lib/queries/inventory-purchases";

import { PurchaseList } from "./purchase-list";

export const dynamic = "force-dynamic";

export default async function PurchasesPage(): Promise<ReactElement> {
  const inventory = await getInventoryPurchases();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Montevideo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return <main className="space-y-5">
    <Link href="/inventory" className="text-sm underline">{t.inventoryPurchases.back}</Link>
    <h1 className="app-title">{t.inventoryPurchases.title}</h1>
    <p className="text-sm text-muted">{t.inventoryPurchases.hint}</p>
    {inventory.day === null ? <p>{t.inventoryPurchases.noInventory}</p> : <p>{t.inventory.latestRun(runDate(inventory.day))}</p>}
    {inventory.day !== null && inventory.day !== inventoryWeek(today) && <p className="text-sm">{t.inventoryPurchases.olderInventory}</p>}
    <p className="text-sm text-muted">{t.inventoryPurchases.unitsHint}</p>
    <PurchaseList products={inventory.products} />
  </main>;
}
