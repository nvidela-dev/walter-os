"use client";

import { useRouter } from "next/navigation";
import { type ReactElement, useState } from "react";

import { FormMessage } from "@/components/form-feedback";
import { useActionForm } from "@/components/hooks/use-action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createDrinkItem, setDrinkActive, setDrinkTarget } from "@/lib/actions/drinks";
import { getFormString } from "@/lib/form";
import type { getDrinkManagement } from "@/lib/queries/drinks";
import type { UnitOption } from "@/lib/types/providers";

type Item = Awaited<ReturnType<typeof getDrinkManagement>>[number];

function DrinkEditor({ item }: { item: Item }): ReactElement {
  const router = useRouter();
  const [quantity, setQuantity] = useState(item.targetUnit === item.unit ? item.targetQuantity ?? "" : "");
  const { error, isSubmitting, runAction } = useActionForm();
  async function save(): Promise<void> {
    const result = await runAction(() => setDrinkTarget({ itemId: item.id, quantity: quantity.trim() === "" ? null : quantity }));
    if (result.ok) router.refresh();
  }
  async function toggle(): Promise<void> {
    const result = await runAction(() => setDrinkActive({ itemId: item.id, active: !item.active }));
    if (result.ok) router.refresh();
  }
  return <section aria-label={item.name} className="space-y-2 rounded-xl border p-3">
    <div className="flex items-center justify-between gap-3"><h2 className="font-bold">{item.name}</h2><Button type="button" variant="ghost" disabled={isSubmitting} onClick={() => { void toggle(); }}>{item.active ? "Ocultar" : "Restaurar"}</Button></div>
    <p className="text-xs text-muted">{item.location} · {item.unit}{!item.active && " · Oculta"}</p>
    {item.active && <form className="flex items-center gap-2" onSubmit={(event) => { event.preventDefault(); void save(); }}>
      <label className="min-w-0 flex-1"><span className="sr-only">Objetivo de {item.name} en {item.location}</span><Input type="number" min="0" max="9999999999.99" step="0.01" placeholder="Sin objetivo" value={quantity} disabled={isSubmitting} onChange={(event) => { setQuantity(event.target.value); }} /></label><span className="text-xs">{item.unit}</span><Button type="submit" disabled={isSubmitting}>Guardar objetivo</Button>
    </form>}
    {item.targetUnit !== null && item.targetUnit !== item.unit && <p className="text-xs">La unidad cambió. Objetivo anterior: {item.targetQuantity} {item.targetUnit}.</p>}
    <FormMessage message={error} />
  </section>;
}

export function DrinkManagement({ items, units }: { items: Item[]; units: UnitOption[] }): ReactElement {
  const router = useRouter();
  const { error, isSubmitting, runAction } = useActionForm();
  const [saved, setSaved] = useState(false);
  async function create(form: HTMLFormElement): Promise<void> {
    const data = new FormData(form);
    setSaved(false);
    const result = await runAction(() => createDrinkItem({ name: getFormString(data, "name"), location: getFormString(data, "location"), unitId: getFormString(data, "unitId") }));
    if (result.ok) { form.reset(); setSaved(true); router.refresh(); }
  }
  return <main className="space-y-4 py-4">
    <h1 className="text-xl font-bold">Bebidas y objetivos</h1>
    <p className="text-sm text-muted">Cada objetivo corresponde a esa ubicación. Vacío significa sin objetivo; 0 significa que no necesitás tener esa bebida allí.</p>
    <form onSubmit={(event) => { event.preventDefault(); void create(event.currentTarget); }} className="space-y-3 rounded-xl border p-4">
      <h2 className="font-semibold">Agregar bebida</h2>
      <fieldset disabled={isSubmitting} className="space-y-3">
        <label className="block text-sm">Nombre<Input name="name" required maxLength={200} placeholder="Ej.: Coca-Cola 600 ml" /></label>
        <label className="block text-sm">Ubicación<Input name="location" required maxLength={200} placeholder="Ej.: Heladera del bar" list="drink-locations" /></label>
        <datalist id="drink-locations">{[...new Set(items.map((item) => item.location))].map((location) => <option key={location} value={location} />)}</datalist>
        <label className="block text-sm">Unidad<Select name="unitId" required defaultValue=""><option value="" disabled>Elegí una unidad</option>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name} ({unit.code})</option>)}</Select></label>
        <Button type="submit">{isSubmitting ? "Guardando…" : "Agregar bebida"}</Button>
      </fieldset>
      <FormMessage message={error} />
      {saved && <p role="status">Bebida agregada.</p>}
    </form>
    {items.map((item) => <DrinkEditor key={`${item.id}:${item.targetQuantity}:${item.targetUnit}:${item.unit}:${item.active}`} item={item} />)}
  </main>;
}
