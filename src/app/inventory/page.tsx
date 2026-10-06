import { ClipboardDocumentListIcon, ClockIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { ReactElement } from "react";

import { t } from "@/i18n";
import { getFridges } from "@/lib/queries/inventory";
import { getInventoryItemSuggestions } from "@/lib/queries/inventory-items";

import { FridgeDetails } from "./fridge-details";
import { FridgeForm } from "./fridge-form";
import { ItemSearch } from "./item-search";

export const dynamic = "force-dynamic";

export default async function InventoryPage(): Promise<ReactElement> {
  const [fridges, items] = await Promise.all([getFridges(), getInventoryItemSuggestions()]);
  return <main className="space-y-5">
    <div><h1 className="text-3xl font-semibold">{t.inventory.fridges}</h1><p className="mt-2 text-muted">{t.inventory.description}</p></div>
    <ItemSearch items={items} />
    <nav aria-label="Inventarios" className="flex items-center gap-3">
      <Link href="/inventory/list" className="ios-glass flex flex-1 items-center gap-3 rounded-2xl p-4 font-medium"><ClipboardDocumentListIcon className="h-6 w-6 shrink-0" aria-hidden="true" />Último inventario</Link>
      <Link href="/inventory/history" aria-label="Historial completo de inventarios" title="Historial completo" className="ios-glass flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"><ClockIcon className="h-6 w-6" aria-hidden="true" /></Link>
    </nav>
    {fridges.length === 0 && <p>{t.inventory.empty}</p>}
    <div className="grid grid-cols-2 gap-3">{fridges.map((fridge) => <div key={fridge.id} className="ios-glass space-y-3 rounded-2xl p-5"><Link href={`/inventory/${fridge.id}`} className="block">
      <span className="block text-xl font-semibold">{t.inventory.fridge(fridge.number)}</span>
      {fridge.name !== null && <span className="mt-2 block text-sm text-muted">{fridge.name}</span>}
    </Link><FridgeDetails fridge={fridge} /></div>)}</div>
    <FridgeForm />
  </main>;
}
