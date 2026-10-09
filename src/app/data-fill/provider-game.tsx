"use client";

import { CheckCircleIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { type ReactElement, useRef, useState } from "react";

import { assignProductProvider } from "@/lib/actions/data-fill";

interface Product { id: string; name: string; unit: string }
interface Supplier { id: string; name: string }

export function ProviderGame({ initialProducts, suppliers }: { initialProducts: Product[]; suppliers: Supplier[] }): ReactElement {
  const [queue, setQueue] = useState(initialProducts);
  const [selected, setSelected] = useState("");
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState(0);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const locked = useRef(false);
  const product = queue[0];
  const normalize = (value: string): string => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();
  const visible = suppliers.filter((supplier) => normalize(supplier.name).includes(normalize(search)));
  const reset = (): void => { setSelected(""); setSearch(""); setError(null); };

  async function save(): Promise<void> {
    if (!product || !selected || locked.current) return;
    locked.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = await assignProductProvider({ productId: product.id, providerId: selected });
      if (!result.ok) { setError(result.error); return; }
      setSaved((count) => count + 1);
      setSuccess(`${product.name} → ${suppliers.find((supplier) => supplier.id === selected)?.name}`);
      setQueue((items) => items.filter((item) => item.id !== product.id));
      reset();
    } catch { setError("No se pudo guardar. Revisá la conexión e intentá de nuevo."); }
    finally { locked.current = false; setBusy(false); }
  }

  return <main className="data-fill space-y-6 py-6">
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="rounded-full bg-emerald-50 px-4 py-2 font-semibold text-emerald-800">{saved} {saved === 1 ? "completado" : "completados"} en esta visita</span>
      <span className="text-muted">{queue.length} pendientes</span>
    </div>
    <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Productos completados en esta visita" aria-valuenow={saved} aria-valuemin={0} aria-valuemax={initialProducts.length || 1}>
      <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${initialProducts.length ? saved / initialProducts.length * 100 : 100}%` }} />
    </div>
    <div aria-live="polite" aria-atomic="true">
      {success !== null && <div key={saved} className="data-fill-celebrate flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-900"><CheckCircleIcon className="h-8 w-8 shrink-0" /><div><p className="font-bold">¡Uno más! Gracias ✨</p><p className="text-sm">{success}</p></div></div>}
    </div>
    {product ? <>
      <section key={product.id} className="data-fill-enter rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-7 text-center">
        <SparklesIcon className="mx-auto mb-4 h-9 w-9 text-emerald-600" />
        <p className="mb-2 text-sm text-muted">¿Qué proveedor trae este producto?</p>
        <h1 className="text-3xl font-bold leading-tight">{product.name}</h1>
        <p className="mt-3 text-sm text-muted">Unidad: {product.unit}</p>
      </section>
      {suppliers.length ? <>
        <fieldset disabled={busy} className="space-y-3">
          <legend className="mb-3 font-semibold">Elegí el proveedor</legend>
          <input type="search" aria-label="Buscar proveedor" placeholder="Buscar proveedor…" value={search} onChange={(event) => { setSearch(event.target.value); }} className="w-full rounded-xl border border-slate-200 p-3 text-base" />
          <div className="max-h-72 space-y-2 overflow-y-auto p-1">
            {visible.map((supplier) => <label key={supplier.id} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border p-4 transition active:scale-[0.98] ${selected === supplier.id ? "border-emerald-600 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-white"}`}>
              <input type="radio" name="supplier" value={supplier.id} checked={selected === supplier.id} onChange={() => { setSelected(supplier.id); }} className="h-5 w-5 accent-emerald-600" />
              <span className="font-semibold">{supplier.name}</span>
            </label>)}
            {!visible.length && <p className="p-3 text-muted">No hay proveedores con ese nombre.</p>}
          </div>
        </fieldset>
        {error !== null && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
        <button type="button" disabled={!selected || busy} onClick={() => void save()} className="min-h-14 w-full rounded-2xl bg-emerald-700 px-5 py-4 text-lg font-bold text-white transition active:scale-[0.98] disabled:opacity-40">{busy ? "Guardando…" : "Guardar y seguir ✨"}</button>
      </> : <p role="status" className="rounded-xl bg-amber-50 p-4">Primero agregá un proveedor de productos en Proveedores.</p>}
      <button type="button" disabled={busy || queue.length < 2} onClick={() => { setQueue((items) => [...items.slice(1), product]); reset(); setSuccess(null); }} className="min-h-12 w-full rounded-xl px-4 py-3 font-semibold text-muted disabled:opacity-40">No sé, pasar</button>
      <p className="text-center text-sm text-muted">Si no sabés, podés pasar. El producto queda pendiente.</p>
    </> : <section className="data-fill-enter rounded-3xl bg-emerald-50 p-8 text-center">
      <SparklesIcon className="mx-auto mb-4 h-12 w-12 text-emerald-600" />
      <h1 className="text-2xl font-bold">¡Todo listo!</h1>
      <p className="mt-3 text-emerald-900">Todos los productos tienen proveedor. Gracias por ayudar.</p>
    </section>}
  </main>;
}
