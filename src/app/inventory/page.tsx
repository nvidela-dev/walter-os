import { ChevronRightIcon, ClipboardDocumentListIcon, ClockIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { ReactElement } from "react";

import { t } from "@/i18n";
import { inventoryWeek } from "@/lib/inventory/run-display";
import { getFridges } from "@/lib/queries/inventory";
import { getInventoryItemSuggestions } from "@/lib/queries/inventory-items";
import { getLatestInventoryProgress } from "@/lib/queries/inventory-runs";

import { FridgeDetails } from "./fridge-details";
import { FridgeForm } from "./fridge-form";
import { ItemSearch } from "./item-search";
import { InventoryProgress } from "./progress";

export const dynamic = "force-dynamic";

export default async function InventoryPage(): Promise<ReactElement> {
  const [fridges, items, progress] = await Promise.all([getFridges(), getInventoryItemSuggestions(), getLatestInventoryProgress()]);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Montevideo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const currentWeek = progress.day === inventoryWeek(today);
  return <main className="space-y-5">
    <div><h1 className="app-title">{t.inventory.fridges}</h1><p className="mt-2 text-sm text-muted">{t.inventory.description}</p></div>
    <ItemSearch items={items} />
    <nav aria-label="Inventarios" className="flex items-stretch gap-3">
      <Link href="/inventory/list" className="app-card app-nav-card flex-1"><ClipboardDocumentListIcon className="h-6 w-6 shrink-0" aria-hidden="true" />{t.inventory.weeklyInventory}<ChevronRightIcon className="ml-auto h-4 w-4 text-muted" aria-hidden="true" /></Link>
      <Link href="/inventory/history" aria-label="Historial completo de inventarios" title="Historial completo" className="app-card flex min-h-16 w-16 shrink-0 items-center justify-center rounded-2xl"><ClockIcon className="h-6 w-6" aria-hidden="true" /></Link>
    </nav>
    <Link href="/inventory/purchases" className="app-card app-nav-card">{t.inventoryPurchases.title}<ChevronRightIcon className="ml-auto h-4 w-4 text-muted" aria-hidden="true" /></Link>
    {fridges.length === 0 && <p>{t.inventory.empty}</p>}
    <div className="grid grid-cols-2 gap-3">{fridges.map((fridge) => <div key={fridge.id} className="app-card app-fridge-card space-y-2 rounded-2xl p-4"><Link href={`/inventory/${fridge.id}`} className="block">
      <span className="block text-lg font-semibold leading-tight tracking-tight">{t.inventory.fridge(fridge.number)}</span>
      {fridge.name !== null && <span className="mt-1 block text-sm text-muted">{fridge.name}</span>}
    </Link><InventoryProgress compact counted={currentWeek ? progress.fridges.find((row) => row.id === fridge.id)?.counted ?? 0 : 0} total={progress.fridges.find((row) => row.id === fridge.id)?.total ?? 0} /><FridgeDetails fridge={fridge} /></div>)}</div>
    <FridgeForm />
  </main>;
}
