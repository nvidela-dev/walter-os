import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";

import { inventoryDate } from "@/lib/inventory/comparison";
import { getInventoryHistory, type InventoryHistoryRow } from "@/lib/queries/inventory";

export const dynamic = "force-dynamic";

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ page?: string; through?: string }> }): Promise<ReactElement> {
  const params = await searchParams;
  const page = Number(params.page ?? "1");
  const through = params.through === undefined ? undefined : Number(params.through);
  if (!Number.isSafeInteger(page) || page < 1 || page > 1000000 || (through !== undefined && (!Number.isSafeInteger(through) || through < 1))) notFound();
  const { rows, hasNext, throughId } = await getInventoryHistory(page, undefined, through);
  const groups = new Map<string, { number: number; name: string | null; rows: InventoryHistoryRow[] }>();
  for (const row of rows) {
    const group = groups.get(row.fridgeId) ?? { number: row.fridgeNumber, name: row.fridgeName, rows: [] };
    group.rows.push(row); groups.set(row.fridgeId, group);
  }
  function href(target: number): string { return `/inventory/history?page=${target}${throughId === null ? "" : `&through=${throughId}`}`; }
  return <main className="space-y-5">
    <nav className="flex flex-wrap gap-4 text-sm underline"><Link href="/inventory">← Heladeras</Link><Link href="/inventory/list">Último inventario</Link></nav>
    <h1 className="text-3xl font-semibold">Historial de inventarios</h1>
    <p className="text-sm text-muted">Todos los conteos guardados, incluidos los anteriores a una corrección y los productos quitados. Más recientes primero dentro de cada heladera.</p>
    {rows.length === 0 && <p>No hay conteos guardados en esta página.</p>}
    {[...groups.entries()].sort(([, a], [, b]) => a.number - b.number).map(([id, group]) => <section key={id} className="space-y-2">
      <h2 className="text-lg font-semibold">Heladera {group.number}{group.name === null ? "" : ` · ${group.name}`}</h2>
      <ul className="divide-y divide-cream-dark">{group.rows.map((row) => <li key={row.id} className="py-3"><p>{row.name} — {row.quantity} {row.unit}</p><p className="text-xs text-muted">{inventoryDate(row.recordedAt)}</p></li>)}</ul>
    </section>)}
    <nav aria-label="Páginas del historial" className="flex items-center justify-between gap-3 text-sm">
      {page > 1 ? <Link className="underline" href={href(page - 1)}>← Más recientes</Link> : <span />}
      <span>Página {page}</span>
      {hasNext ? <Link className="underline" href={href(page + 1)}>Más antiguos →</Link> : <span />}
    </nav>
  </main>;
}
