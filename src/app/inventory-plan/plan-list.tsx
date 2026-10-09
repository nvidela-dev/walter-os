"use client";

import Link from "next/link";
import { type ReactElement, useState } from "react";

import type { InventoryPlanItem } from "@/lib/queries/inventory-plan";

import { TargetForm } from "../inventory/items/[id]/target-form";

export function PlanList({ items }: { items: InventoryPlanItem[] }): ReactElement {
  const [search, setSearch] = useState("");
  const [missingOnly, setMissingOnly] = useState(false);
  const normalize = (value: string): string => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();
  const isPlanned = (item: InventoryPlanItem): boolean => item.quantity !== null && item.targetUnit === item.unit;
  const planned = items.filter(isPlanned).length;
  const visible = items.filter((item) => normalize(item.name).includes(normalize(search)) && (!missingOnly || !isPlanned(item)));

  const groups = new Map<string, { number: number; name: string | null; items: InventoryPlanItem[] }>();
  for (const item of visible) {
    for (const location of item.locations) {
      const group = groups.get(location.id) ?? { number: location.number, name: location.name, items: [] };
      group.items.push(item);
      groups.set(location.id, group);
    }
  }

  return <div className="space-y-4">
    <p role="status" className="text-sm font-semibold">{planned} de {items.length} productos planificados</p>
    <label className="block"><span className="sr-only">Buscar producto</span>
      <input type="search" value={search} onChange={(event) => { setSearch(event.target.value); }} placeholder="Buscar producto…" className=" w-full rounded-xl border border-slate-200 p-3 font-normal" />
    </label>
    <label className="flex min-h-11 items-center gap-2 text-sm">
      <input type="checkbox" checked={missingOnly} onChange={(event) => { setMissingOnly(event.target.checked); }} className="h-5 w-5" />
      Mostrar solo los que faltan
    </label>
    {[...groups.entries()].sort(([, a], [, b]) => a.number - b.number).map(([id, group]) => <section key={id} aria-label={`Heladera ${group.number}`} className="overflow-hidden rounded-2xl border border-slate-200">
      <div className="flex items-center justify-between gap-3 bg-slate-50 px-3 py-2">
      <h2 className="min-w-0 text-base font-bold">Heladera {group.number}{group.name !== null && group.name !== "" ? ` · ${group.name}` : ""}</h2>
      <span className="shrink-0 text-xs text-muted" aria-label={`${group.items.filter(isPlanned).length} de ${group.items.length} productos mostrados planificados`}>{group.items.filter(isPlanned).length}/{group.items.length}</span>
      </div>
      <div className="divide-y divide-slate-200">
      {group.items.map((item) => <section key={item.id} aria-label={item.name} className="bg-white px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="min-w-0 text-base font-semibold leading-tight">{item.name}</h3>
        <Link href={`/inventory/items/${item.id}/targets`} aria-label={`Ver cambios anteriores de ${item.name}`} className="inline-flex min-h-11 shrink-0 items-center px-2 text-xs text-muted underline">Historial</Link>
      </div>
      {item.targetUnit !== null && item.targetUnit !== item.unit && <p className="mb-2 rounded-lg bg-amber-50 p-2 text-xs">La unidad cambió. El objetivo anterior era {item.quantity} {item.targetUnit}. Confirmá la cantidad en {item.unit}.</p>}
      {item.locations.length > 1 && <p className="mb-2 text-xs text-muted">También está en {item.locations.filter((location) => location.id !== id).map((location) => `Heladera ${location.number}`).join(", ")}. El objetivo es compartido entre todas.</p>}
      <TargetForm compact key={`${item.id}:${item.targetId ?? "new"}`} productId={item.id} unit={item.unit} quantity={isPlanned(item) ? item.quantity : null} />
    </section>)}
      </div>
    </section>)}
    {visible.length === 0 && <p className="rounded-2xl bg-slate-50 p-6 text-center">{items.length === 0 ? "Todavía no hay productos en las heladeras activas." : missingOnly && search === "" ? "¡Todos los productos están planificados!" : "No hay productos que coincidan con esta búsqueda."}</p>}
  </div>;
}
