import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";

import { inventoryDate } from "@/lib/inventory/comparison";
import { getInventoryHistory, type InventoryHistoryRow } from "@/lib/queries/inventory";

import { FridgeGroup } from "../fridge-group";

export const dynamic = "force-dynamic";

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ page?: string; through?: string }> }): Promise<ReactElement> {
  const params = await searchParams;
  const page = Number(params.page ?? "1");
  const through = params.through === undefined ? undefined : Number(params.through);
  if (!Number.isSafeInteger(page) || page < 1 || page > 1000000 || (through !== undefined && (!Number.isSafeInteger(through) || through < 1))) notFound();
  const { rows, hasNext, throughId } = await getInventoryHistory(page, undefined, through);
  const inventories = new Map<string, Map<string, { number: number; name: string | null; rows: InventoryHistoryRow[] }>>();
  for (const row of rows) {
    const groups = inventories.get(row.recordedAt) ?? new Map<string, { number: number; name: string | null; rows: InventoryHistoryRow[] }>();
    const group = groups.get(row.fridgeId) ?? { number: row.fridgeNumber, name: row.fridgeName, rows: [] };
    group.rows.push(row); groups.set(row.fridgeId, group); inventories.set(row.recordedAt, groups);
  }
  function href(target: number): string { return `/inventory/history?page=${target}${throughId === null ? "" : `&through=${throughId}`}`; }
  return <main className="space-y-5">
    <nav className="flex flex-wrap gap-4 text-sm underline"><Link href="/inventory">← Heladeras</Link><Link href="/inventory/list">Último inventario</Link></nav>
    <h1 className="text-3xl font-semibold">Historial de inventarios</h1>
    <p className="text-sm text-muted">Abrí una fecha para ver los conteos guardados en ese momento, agrupados por heladera.</p>
    {rows.length === 0 && <p>No hay conteos guardados en esta página.</p>}
    {[...inventories.entries()].map(([date, groups]) => <details key={date} className="ios-glass overflow-hidden rounded-2xl">
      <summary className="cursor-pointer px-5 py-4 font-semibold">{inventoryDate(date)}</summary>
      <div className="space-y-4 px-4 pb-4">{[...groups.entries()].sort(([, a], [, b]) => a.number - b.number).map(([id, group]) => <FridgeGroup key={id} number={group.number} name={group.name}>
        <ul className="divide-y divide-cream-dark">{group.rows.map((row) => <li key={row.id} className="py-3">{row.name} — {row.quantity} {row.unit}</li>)}</ul>
      </FridgeGroup>)}</div>
    </details>)}
    <nav aria-label="Páginas del historial" className="flex items-center justify-between gap-3 text-sm">
      {page > 1 ? <Link className="underline" href={href(page - 1)}>← Más recientes</Link> : <span />}
      <span>Página {page}</span>
      {hasNext ? <Link className="underline" href={href(page + 1)}>Más antiguos →</Link> : <span />}
    </nav>
  </main>;
}
