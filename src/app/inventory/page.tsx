import { ClipboardDocumentListIcon, ClockIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { ReactElement } from "react";

import { t } from "@/i18n";
import { inventoryWeek, runDate } from "@/lib/inventory/run-display";
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
    <div><h1 className="text-3xl font-semibold">{t.inventory.fridges}</h1><p className="mt-2 text-muted">{t.inventory.description}</p></div>
    <section className="ios-glass space-y-2 rounded-2xl p-4">
      <h2 className="font-semibold">{t.inventory.weeklyStatus}</h2>
      {progress.day !== null && <p className="text-sm">{t.inventory.latestRun(runDate(progress.day))}</p>}
      {currentWeek ? <InventoryProgress {...progress.fridges.reduce((sum, fridge) => ({ counted: sum.counted + fridge.counted, total: sum.total + fridge.total }), { counted: 0, total: 0 })} /> : <p className="text-sm text-muted">{t.inventory.weeklyNotStarted}</p>}
      <Link href="/inventory/new" className="block text-sm font-medium underline">{currentWeek ? t.inventory.weeklyEdit : t.inventory.weeklyStart}</Link>
    </section>
    <ItemSearch items={items} />
    <nav aria-label="Inventarios" className="flex items-center gap-3">
      <Link href="/inventory/list" className="ios-glass flex flex-1 items-center gap-3 rounded-2xl p-4 font-medium"><ClipboardDocumentListIcon className="h-6 w-6 shrink-0" aria-hidden="true" />Último inventario</Link>
      <Link href="/inventory/history" aria-label="Historial completo de inventarios" title="Historial completo" className="ios-glass flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"><ClockIcon className="h-6 w-6" aria-hidden="true" /></Link>
    </nav>
    <Link href="/inventory/purchases" className="ios-glass block rounded-2xl p-4 font-medium">{t.inventoryPurchases.title}</Link>
    {fridges.length === 0 && <p>{t.inventory.empty}</p>}
    <div className="grid grid-cols-2 gap-3">{fridges.map((fridge) => <div key={fridge.id} className="ios-glass space-y-3 rounded-2xl p-5"><Link href={`/inventory/${fridge.id}`} className="block">
      <span className="block text-xl font-semibold">{t.inventory.fridge(fridge.number)}</span>
      {fridge.name !== null && <span className="mt-2 block text-sm text-muted">{fridge.name}</span>}
    </Link><InventoryProgress counted={currentWeek ? progress.fridges.find((row) => row.id === fridge.id)?.counted ?? 0 : 0} total={progress.fridges.find((row) => row.id === fridge.id)?.total ?? 0} /><FridgeDetails fridge={fridge} /></div>)}</div>
    <FridgeForm />
  </main>;
}
