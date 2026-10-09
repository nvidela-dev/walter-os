import type { ReactElement } from "react";

import { PageHeader } from "@/components/ui/page-header";
import { getInventoryPlan } from "@/lib/queries/inventory-plan";

import { PlanList } from "./plan-list";

export const dynamic = "force-dynamic";

export default async function InventoryPlanPage(): Promise<ReactElement> {
  const items = await getInventoryPlan();
  return <div className="app-page max-w-2xl">
    <PageHeader title="Plan de Inventario" backHref="/" backLabel="Inicio" />
    <main className="space-y-4 py-4">
      <details className="text-sm text-muted">
        <summary>Cómo completar el plan</summary>
        <p className="py-2">Cada cantidad es el objetivo total del producto entre todas las heladeras. Vacío significa pendiente; 0 significa que no necesitás tener ese producto.</p>
      </details>
      <PlanList items={items} />
    </main>
  </div>;
}
