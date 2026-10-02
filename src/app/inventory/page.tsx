import Link from "next/link";
import type { ReactElement } from "react";

import { t } from "@/i18n";
import { getFridges } from "@/lib/queries/inventory";

import { FridgeForm } from "./fridge-form";

export const dynamic = "force-dynamic";

export default async function InventoryPage(): Promise<ReactElement> {
  const fridges = await getFridges();
  return <main className="space-y-5">
    <div><h1 className="text-3xl font-semibold">{t.inventory.fridges}</h1><p className="mt-2 text-muted">{t.inventory.description}</p></div>
    {fridges.length === 0 && <p>{t.inventory.empty}</p>}
    <div className="grid grid-cols-2 gap-3">{fridges.map((fridge) => <Link key={fridge.id} href={`/inventory/${fridge.id}`} className="ios-glass rounded-2xl p-5">
      <span className="block text-xl font-semibold">{t.inventory.fridge(fridge.number)}</span>
      {fridge.name !== null && <span className="mt-2 block text-sm text-muted">{fridge.name}</span>}
    </Link>)}</div>
    <Link href="/inventory/review" className="ios-glass block rounded-2xl p-5"><span className="block text-lg font-semibold">Inventario en papel · sin catalogar</span><span className="block text-sm text-muted">Revisar las dos páginas del 29/9/26 y agregar productos por lote.</span></Link>
    <FridgeForm />
  </main>;
}
