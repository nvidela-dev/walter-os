import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";

import { runChange, runDate } from "@/lib/inventory/run-display";
import { getInventoryRuns, type RunEntry } from "@/lib/queries/inventory-runs";

import { FridgeGroup } from "../fridge-group";

export const dynamic = "force-dynamic";

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ page?: string }> }): Promise<ReactElement> {
  const params = await searchParams;
  const page = Number(params.page ?? "1");
  if (!Number.isSafeInteger(page) || page < 1 || page > 1000000) notFound();
  const { runs, hasNext } = await getInventoryRuns(page);
  return <main className="space-y-5">
    <nav className="flex flex-wrap gap-4 text-sm underline"><Link href="/inventory">← Heladeras</Link><Link href="/inventory/list">Último inventario</Link></nav>
    <h1 className="text-3xl font-semibold">Historial de inventarios</h1>
    <p className="text-sm text-muted">Un inventario por día. Abrí una fecha para ver sus cantidades y cambios frente al inventario anterior.</p>
    {runs.length === 0 && <p>No hay inventarios guardados.</p>}
    {runs.map((run) => {
      const groups = new Map<string, RunEntry[]>();
      for (const entry of run.entries) groups.set(entry.fridgeId, [...(groups.get(entry.fridgeId) ?? []), entry]);
      return <details key={run.id} className="ios-glass overflow-hidden rounded-2xl">
        <summary className="cursor-pointer px-5 py-4 font-semibold">{runDate(run.day)}</summary>
        <div className="space-y-4 px-4 pb-4">
          {run.initial && <p className="text-sm text-muted">Inventario inicial</p>}
          {[...groups.entries()].map(([id, entries]) => {
            const fridge = entries[0];
            if (fridge == null) return null;
            return <FridgeGroup key={id} number={fridge.fridgeNumber} name={fridge.fridgeName}>
              <ul className="divide-y divide-cream-dark">{entries.map((entry) => {
                const change = runChange(entry.difference, run.initial);
                return <li key={entry.productId} className="py-3"><p>{entry.name} — {entry.quantity} {entry.unit}</p>
                  {change !== null && <p className="text-sm text-muted">{change}</p>}
                  {entry.note !== null && <p className="whitespace-pre-wrap text-sm text-muted">{entry.note}</p>}
                </li>;
              })}</ul>
            </FridgeGroup>;
          })}
        </div>
      </details>;
    })}
    <nav aria-label="Páginas del historial" className="flex items-center justify-between gap-3 text-sm">
      {page > 1 ? <Link className="underline" href={`/inventory/history?page=${page - 1}`}>← Más recientes</Link> : <span />}
      <span>Página {page}</span>
      {hasNext ? <Link className="underline" href={`/inventory/history?page=${page + 1}`}>Más antiguos →</Link> : <span />}
    </nav>
  </main>;
}
