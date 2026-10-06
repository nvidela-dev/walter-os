import Decimal from "decimal.js";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";

import { runChange, runDate } from "@/lib/inventory/run-display";
import { getInventoryItemDetail } from "@/lib/queries/inventory-items";

import { FridgeGroup } from "../../fridge-group";

export const dynamic = "force-dynamic";

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }): Promise<ReactElement> {
  const { id } = await params;
  const item = await getInventoryItemDetail(id);
  if (item === null) notFound();
  const totals = new Map<string, Decimal>();
  for (const { row } of item.locations) if (row.current !== null) totals.set(row.current.unit, (totals.get(row.current.unit) ?? new Decimal(0)).plus(row.current.quantity));
  const missing = item.locations.some(({ row }) => row.current === null);
  const comparable = !missing && totals.size === 1 && item.locations.every(({ row }) => row.difference !== null);
  const change = comparable ? item.locations.reduce((sum, { row }) => sum.plus(row.difference ?? "0"), new Decimal(0)).toString() : null;
  return <main className="space-y-5">
    <Link href="/inventory" className="text-sm underline">← Buscar otro producto</Link>
    <h1 className="text-3xl font-semibold">{item.name}</h1>
    <p className="text-sm text-muted">{item.day === null ? "Todavía no hay inventario." : `Inventario del ${runDate(item.day)}`}</p>
    <section className="ios-glass space-y-3 rounded-2xl p-5">
      <h2 className="font-semibold">Cantidad disponible</h2>
      {totals.size === 0 ? <p>Sin conteo en el último inventario</p> : [...totals.entries()].map(([unit, amount]) => <p className="text-2xl font-semibold" key={unit}>{amount.toString()} {unit}</p>)}
      {missing && totals.size > 0 && <p className="text-sm text-muted">Total parcial: hay heladeras sin contar.</p>}
      {item.initial ? <p className="text-sm text-muted">Inventario inicial: sin comparación.</p> : <div><h2 className="font-semibold">Cambio de stock esta semana</h2><p>{runChange(change)}</p><p className="text-sm text-muted">Comparado con el inventario anterior; no indica consumo.</p></div>}
    </section>
    <section className="ios-glass rounded-2xl p-5"><h2 className="font-semibold">Proveedor</h2><p className="mt-2">{item.providers.length === 0 ? "Proveedor no asignado" : item.providers.join(" · ")}</p></section>
    <h2 className="text-lg font-semibold">Ubicación</h2>
    {item.locations.map((location) => <FridgeGroup key={location.id} number={location.number} name={location.name}>
      <p>{location.row.current === null ? "Sin conteo en este inventario" : `${location.row.current.quantity} ${location.row.current.unit}`}</p>
      {!item.initial && location.row.current !== null && <p className="text-sm text-muted">{runChange(location.row.difference)}</p>}
      {location.row.note !== null && <p className="whitespace-pre-wrap text-sm">{location.row.note}</p>}
      <Link href={`/inventory/${location.id}`} className="text-sm underline">Ver heladera</Link>
    </FridgeGroup>)}
  </main>;
}
