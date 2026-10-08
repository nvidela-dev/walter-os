import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";

import { t } from "@/i18n";
import { runChange, runDate } from "@/lib/inventory/run-display";
import { getInventoryRun, type RunEntry } from "@/lib/queries/inventory-runs";

import { FridgeGroup } from "../../fridge-group";

export const dynamic = "force-dynamic";

export default async function InventoryHistoryDetail({ params }: { params: Promise<{ id: string }> }): Promise<ReactElement> {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const run = await getInventoryRun(Number(id));
  if (run === null) notFound();
  const groups = new Map<string, RunEntry[]>();
  for (const entry of run.entries) {
    const entries = groups.get(entry.fridgeId) ?? [];
    entries.push(entry);
    groups.set(entry.fridgeId, entries);
  }
  return <main className="space-y-5">
    <Link href="/inventory/history" className="text-sm underline">{t.inventory.historyBack}</Link>
    <h1 className="app-title">{runDate(run.day)}</h1>
    <p className="text-sm text-muted">{t.inventory.runDetailHint}</p>
    {run.initial && <p className="text-sm text-muted">{t.inventory.initialRun}</p>}
    {run.entries.length === 0 && <p>{t.inventory.emptyRun}</p>}
    {[...groups.entries()].map(([fridgeId, entries]) => {
      const fridge = entries[0];
      if (fridge === undefined) return null;
      return <FridgeGroup key={fridgeId} number={fridge.fridgeNumber} name={fridge.fridgeName}>
        <ul className="divide-y divide-cream-dark">{entries.map((entry) => {
          const change = runChange(entry.difference, run.initial);
          return <li key={entry.productId} className="py-3">
            <p>{entry.name} — {entry.quantity} {entry.unit}</p>
            {change !== null && <p className="text-sm text-muted">{change}</p>}
            {entry.note !== null && <p className="whitespace-pre-wrap text-sm text-muted">{entry.note}</p>}
          </li>;
        })}</ul>
      </FridgeGroup>;
    })}
  </main>;
}
