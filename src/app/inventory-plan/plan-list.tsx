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

  return <div className="space-y-5">
    <p role="status" className="font-semibold">{planned} de {items.length} productos planificados</p>
    <label className="block font-semibold">Buscar producto
      <input type="search" value={search} onChange={(event) => { setSearch(event.target.value); }} placeholder="Nombre del producto…" className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal" />
    </label>
    <label className="flex min-h-12 items-center gap-3">
      <input type="checkbox" checked={missingOnly} onChange={(event) => { setMissingOnly(event.target.checked); }} className="h-5 w-5" />
      Mostrar solo los que faltan
    </label>
    {[...groups.entries()].sort(([, a], [, b]) => a.number - b.number).map(([id, group]) => <section key={id} aria-label={`Heladera ${group.number}`} className="space-y-3">
      <h2 className="border-b border-slate-200 pb-3 text-2xl font-bold">Heladera {group.number}{group.name !== null && group.name !== "" ? ` · ${group.name}` : ""}</h2>
      <p className="text-sm text-muted">{group.items.filter(isPlanned).length} de {group.items.length} productos mostrados planificados</p>
      {group.items.map((item) => <section key={item.id} aria-label={item.name} className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="mb-2 text-xl font-bold">{item.name}</h3>
      <p className="mb-4 text-sm text-muted">{isPlanned(item) ? `Objetivo actual: ${item.quantity} ${item.unit}` : "Sin planificar"}</p>
      {item.targetUnit !== null && item.targetUnit !== item.unit && <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm">La unidad cambió. El objetivo anterior era {item.quantity} {item.targetUnit}. Confirmá la cantidad en {item.unit}.</p>}
      {item.locations.length > 1 && <p className="mb-4 text-sm text-muted">También está en {item.locations.filter((location) => location.id !== id).map((location) => `Heladera ${location.number}`).join(", ")}. El objetivo es compartido entre todas.</p>}
      <TargetForm key={`${item.id}:${item.targetId ?? "new"}`} productId={item.id} unit={item.unit} quantity={isPlanned(item) ? item.quantity : null} />
      <Link href={`/inventory/items/${item.id}/targets`} className="mt-4 inline-flex min-h-11 items-center text-sm underline">Ver cambios anteriores</Link>
    </section>)}
    </section>)}
    {visible.length === 0 && <p className="rounded-2xl bg-slate-50 p-6 text-center">{items.length === 0 ? "Todavía no hay productos en las heladeras activas." : missingOnly && search === "" ? "¡Todos los productos están planificados!" : "No hay productos que coincidan con esta búsqueda."}</p>}
  </div>;
}
