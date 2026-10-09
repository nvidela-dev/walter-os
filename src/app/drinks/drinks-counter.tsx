"use client";

import Decimal from "decimal.js";
import { useRouter } from "next/navigation";
import { type ReactElement, useState } from "react";

import { FormMessage } from "@/components/form-feedback";
import { useActionForm } from "@/components/hooks/use-action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveDrinkCounts } from "@/lib/actions/drinks";
import type { DrinkRow } from "@/lib/queries/drinks";

export function DrinksCounter({ week, items }: { week: string; items: DrinkRow[] }): ReactElement {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [pendingOnly, setPendingOnly] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const { error, isSubmitting, runAction } = useActionForm();
  const normalize = (value: string): string => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const counted = (item: DrinkRow): boolean => item.quantity !== null && item.countedUnit === item.unit;
  const visible = items.filter((item) => normalize(item.name).includes(normalize(search)) && (!pendingOnly || !counted(item)));
  const locations = [...new Set(visible.map((item) => item.location))];
  const entries = Object.entries(values).filter(([, quantity]) => quantity.trim() !== "");
  async function save(): Promise<void> {
    setSaved(false);
    const result = await runAction(() => saveDrinkCounts(entries.map(([itemId, quantity]) => ({ itemId, quantity, unit: items.find((item) => item.id === itemId)?.unit ?? "" }))));
    if (result.ok) { setValues({}); setSaved(true); router.refresh(); }
  }
  return <main className="space-y-4 py-4">
    <div><h1 className="font-bold">Semana del {week}</h1><p className="text-sm text-muted">Martes a lunes · {items.filter(counted).length} de {items.length} bebidas contadas</p></div>
    <p className="text-sm text-muted">Completá lo que contaste. Vacío significa sin revisar; 0 significa que no queda nada. Para corregir un conteo, ingresá la cantidad nueva.</p>
    <label className="block"><span className="sr-only">Buscar bebida</span><Input type="search" placeholder="Buscar bebida…" value={search} onChange={(event) => { setSearch(event.target.value); }} /></label>
    <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={pendingOnly} onChange={(event) => { setPendingOnly(event.target.checked); }} className="h-5 w-5" />Solo pendientes</label>
    <form onSubmit={(event) => { event.preventDefault(); void save(); }} className="space-y-4">
      <fieldset disabled={isSubmitting} className="space-y-4">
        {locations.map((location) => <section key={location} aria-label={location} className="overflow-hidden rounded-2xl border border-slate-200">
          <h2 className="bg-slate-50 px-3 py-2 font-bold">{location}</h2>
          <div className="divide-y divide-slate-200">{visible.filter((item) => item.location === location).map((item) => {
            const difference = counted(item) && item.previousQuantity !== null && item.previousUnit === item.unit
              ? new Decimal(item.quantity ?? "0").minus(item.previousQuantity).toString() : null;
            const shortage = counted(item) && item.targetQuantity !== null && item.targetUnit === item.unit
              ? Decimal.max(0, new Decimal(item.targetQuantity).minus(item.quantity ?? "0")).toString() : null;
            return <div key={item.id} className="space-y-1 px-3 py-3">
              <label className="flex items-center justify-between gap-3">
                <span className="min-w-0 flex-1 font-semibold">{item.name}</span>
                <Input aria-label={`Conteo de ${item.name} en ${location}`} className="w-24! shrink-0" type="number" inputMode="decimal" min="0" max="9999999999.99" step="0.01" placeholder={counted(item) ? item.quantity ?? "" : "—"} value={values[item.id] ?? ""} onChange={(event) => { setValues((current) => ({ ...current, [item.id]: event.target.value })); setSaved(false); }} />
                <span className="w-12 shrink-0 text-xs text-muted">{item.unit}</span>
              </label>
              <p className="text-xs text-muted">{counted(item) ? `Guardado: ${item.quantity} ${item.unit}` : "Sin revisar esta semana"}
                {difference !== null && ` · Cambio: ${new Decimal(difference).gt(0) ? "+" : ""}${difference}`}
                {shortage !== null && ` · Faltan: ${shortage}`}
              </p>
              {item.targetQuantity !== null && <p className="text-xs text-muted">Objetivo: {item.targetQuantity} {item.targetUnit}{item.targetUnit !== item.unit && " · Revisar unidad con Admin"}</p>}
            </div>;
          })}</div>
        </section>)}
      </fieldset>
      {visible.length === 0 && <p className="rounded-xl bg-slate-50 p-5 text-sm">{items.length === 0 ? "Todavía no hay bebidas. Admin puede agregarlas en Bebidas y objetivos." : "No hay bebidas para mostrar con estos filtros."}</p>}
      <FormMessage message={error} />
      {saved && <p role="status" className="text-sm text-emerald-800">Conteos guardados.</p>}
      <div className="sticky bottom-0 border-t bg-white py-3">
        <Button type="submit" disabled={isSubmitting || entries.length === 0} className="w-full">{isSubmitting ? "Guardando…" : `Guardar conteos (${entries.length})`}</Button>
      </div>
    </form>
  </main>;
}
