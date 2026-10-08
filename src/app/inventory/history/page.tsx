import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";

import { t } from "@/i18n";
import { runDate } from "@/lib/inventory/run-display";
import { getInventoryRuns } from "@/lib/queries/inventory-runs";


export const dynamic = "force-dynamic";

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ page?: string }> }): Promise<ReactElement> {
  const params = await searchParams;
  const page = Number(params.page ?? "1");
  if (!Number.isSafeInteger(page) || page < 1 || page > 1000000) notFound();
  const { runs, hasNext } = await getInventoryRuns(page);
  return <main className="space-y-5">
    <nav className="flex flex-wrap gap-4 text-sm underline"><Link href="/inventory">← Heladeras</Link><Link href="/inventory/list">Último inventario</Link></nav>
    <h1 className="text-3xl font-semibold">Historial de inventarios</h1>
    <p className="text-sm text-muted">{t.inventory.weeklyHistoryHint}</p>
    {runs.length === 0 && <p>No hay inventarios guardados.</p>}
    <div className="space-y-3">{runs.map((run) => <Link key={run.id} href={`/inventory/history/${run.id}`} className="app-card block rounded-2xl px-5 py-4 font-semibold">
      {runDate(run.day)}
    </Link>)}</div>
    <nav aria-label="Páginas del historial" className="flex items-center justify-between gap-3 text-sm">
      {page > 1 ? <Link className="underline" href={`/inventory/history?page=${page - 1}`}>← Más recientes</Link> : <span />}
      <span>Página {page}</span>
      {hasNext ? <Link className="underline" href={`/inventory/history?page=${page + 1}`}>Más antiguos →</Link> : <span />}
    </nav>
  </main>;
}
