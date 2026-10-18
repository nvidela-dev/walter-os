import type { ReactElement } from "react";

import { OrderReport } from "@/components/order-report";
import { buttonClassName } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { getInventoryPurchases } from "@/lib/queries/inventory-purchases";
import { getInventoryRuns } from "@/lib/queries/inventory-runs";

export const dynamic = "force-dynamic";
export default async function PurchasesPage({ searchParams }: { searchParams: Promise<{run?: string; page?: string}> }): Promise<ReactElement> {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const { runs, hasNext } = await getInventoryRuns(page);
  const requested = Number(params.run);
  const runId = Number.isSafeInteger(requested) && requested > 0 ? requested : runs[0]?.id;
  const inventory = await getInventoryPurchases(runId);
  return <main className="space-y-4"><h1 className="app-title">Crear pedidos · Alimentos</h1>
    <form className="space-y-2"><input type="hidden" name="page" value={page} /><label className="block text-sm">Inventario de referencia<Select name="run" defaultValue={runId}>{inventory.day !== null && !runs.some(run => run.id === runId) && <option value={runId}>Semana del {inventory.day}</option>}{runs.map(run => <option key={run.id} value={run.id}>Semana del {run.day}</option>)}</Select></label><button className={buttonClassName({variant:"secondary"})} disabled={runs.length === 0}>Usar este inventario</button></form>
    {hasNext && <a className="app-text-action" href={`?page=${page+1}`}>Ver inventarios anteriores →</a>}
    {inventory.day !== null ? <OrderReport key={runId} products={inventory.products} label="Alimentos" date={inventory.day} /> : <p>No hay inventario seleccionado.</p>}
  </main>;
}
