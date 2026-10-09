import Link from "next/link";
import type { ReactElement } from "react";

import { getDrinkHistory } from "@/lib/queries/drinks";

export const dynamic = "force-dynamic";

export default async function DrinksHistoryPage({ searchParams }: { searchParams: Promise<{ page?: string; week?: string }> }): Promise<ReactElement> {
  const params = await searchParams;
  const page = Number(params.page ?? "1");
  const history = await getDrinkHistory(page, params.week);
  return <main className="space-y-4 py-4">
    <h1 className="text-xl font-bold">Historial de bebidas</h1>
    <div className="flex flex-wrap gap-2">{history.weeks.map((week) => <Link key={week} href={`/drinks/history?page=${page}&week=${week}`} aria-current={week === history.selected ? "page" : undefined} className={`rounded-xl border px-3 py-3 text-sm ${week === history.selected ? "bg-slate-100 font-bold" : ""}`}>Semana del {week}</Link>)}</div>
    {history.selected !== null && <h2 className="font-semibold">Semana del {history.selected}</h2>}
    <p className="text-sm text-muted">Último conteo guardado de cada bebida en esa semana. Las correcciones conservan el registro original.</p>
    <div className="divide-y rounded-xl border">{history.entries.map((entry) => <div key={entry.itemId} className="flex justify-between gap-3 p-3"><div><p className="font-semibold">{entry.name}</p><p className="text-xs text-muted">{entry.location}</p></div><p>{entry.quantity} {entry.unit}</p></div>)}</div>
    {history.weeks.length === 0 && <p>Todavía no hay conteos guardados.</p>}
    <div className="flex justify-between">{page > 1 && <Link href={`/drinks/history?page=${page - 1}`} className="py-3 underline">Más recientes</Link>}{history.hasNext && <Link href={`/drinks/history?page=${page + 1}`} className="py-3 underline">Más antiguos</Link>}</div>
  </main>;
}
