import Link from "next/link";
import type { ReactElement } from "react";

import { drinkCategory, drinkHref } from "@/lib/drinks/categories";
import { getDrinksInventory, getDrinkSuppliers } from "@/lib/queries/drinks";

export const dynamic = "force-dynamic";

export default async function DrinkSummaryPage({ searchParams }: { searchParams: Promise<{ category?: string }> }): Promise<ReactElement> {
  const category = drinkCategory((await searchParams).category);
  const [inventory, suppliers] = await Promise.all([getDrinksInventory(), getDrinkSuppliers()]);
  const items = inventory.items.filter((item) => item.category === category);
  const groups = new Map<string, typeof items>();
  for (const item of items) {
    const links = [...new Map(suppliers.filter((link) => link.itemId === item.id).map((link) => [link.providerId, link])).values()];
    const name = links.length === 0 ? "Sin proveedor" : links.length === 1 ? (links[0]?.name ?? "Sin proveedor") : `Varios proveedores: ${links.map((link) => link.name).sort().join(", ")}`;
    groups.set(name, [...(groups.get(name) ?? []), item]);
  }
  return <main className="space-y-4 py-4">
    <h1 className="text-xl font-bold">{category} · Por proveedor</h1>
    <p className="text-sm text-muted">Semana del {inventory.week}. Últimos conteos guardados. Una bebida con varios proveedores aparece una sola vez; no se asigna su stock a ninguno.</p>
    {[...groups].sort(([a], [b]) => a.localeCompare(b)).map(([name, rows]) => <section key={name} className="rounded-xl border"><h2 className="bg-slate-50 p-3 font-bold">{name}</h2><div className="divide-y">{rows.map((item) => <div key={item.id} className="flex justify-between gap-3 p-3"><div><p className="font-semibold">{item.name}</p><p className="text-xs text-muted">{item.location}</p></div><p>{item.quantity !== null && item.countedUnit === item.unit ? `${item.quantity} ${item.unit}` : "Sin revisar"}</p></div>)}</div></section>)}
    {items.length === 0 && <p>Todavía no hay bebidas en esta categoría.</p>}
    <Link href={drinkHref("/drinks", category)} className="inline-block py-3 underline">Seguir contando {category}</Link>
  </main>;
}
