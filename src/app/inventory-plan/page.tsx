import type { ReactElement } from "react";

import { PageHeader } from "@/components/ui/page-header";
import { getInventoryPlan } from "@/lib/queries/inventory-plan";

import { PlanList } from "./plan-list";

export const dynamic = "force-dynamic";

export default async function InventoryPlanPage(): Promise<ReactElement> {
  const items = await getInventoryPlan();
  return <div className="app-page max-w-2xl">
    <PageHeader title="Plan de Inventario" backHref="/" backLabel="Inicio" />
    <main className="space-y-6 py-6">
      <p className="text-muted">¿Cuánto debería haber de cada producto? Estas cantidades son el objetivo total, sumando todas las heladeras.</p>
      <p className="rounded-2xl bg-amber-50 p-4 text-sm">Vacío significa que todavía no lo planificaste. Poné 0 si no necesitás tener ese producto.</p>
      <PlanList items={items} />
    </main>
  </div>;
}
