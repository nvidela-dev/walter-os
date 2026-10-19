"use client";

import Link from "next/link";
import { type ReactElement,useState } from "react";

import { FormMessage } from "@/components/form-feedback";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { orderMessage } from "@/lib/inventory/order-message";
import { groupInventoryPurchases, type PurchaseProduct } from "@/lib/inventory/purchases";

export function OrderReport({ products, label, date }: { products: PurchaseProduct[]; label: string; date: string }): ReactElement {
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  async function copy(text: string, supplier: string): Promise<void> {
    setFeedback(null); setCopyError(null);
    try { await navigator.clipboard.writeText(text); setFeedback(`Pedido de ${supplier} copiado.`); }
    catch { setCopyError("No se pudo copiar automáticamente. Seleccioná el texto del pedido y copialo."); }
  }
  const groups = groupInventoryPurchases(products, choices);
  const missingSuppliers = groups.unresolved.filter(product => product.suppliers.length === 0);
  const providerHref = `/data-fill?products=${encodeURIComponent(missingSuppliers.map(product => product.id).join(","))}`;
  const providerLink = missingSuppliers.length > 0 ? <Link href={providerHref} className="inline-block font-semibold underline">¿Quién lo trae? · Completar proveedores</Link> : null;
  const issues = { "missing-count": "Falta conteo", "missing-target": "Falta objetivo", "unit-mismatch": "Unidades incompatibles" };
  return <div className="space-y-4">
    <p className="text-sm text-muted">Inventario: {date}. Usa los objetivos y proveedores actuales al abrir esta pantalla. Se calcula máximo(objetivo − stock, 0), sin convertir unidades ni adivinar proveedores. Este informe no envía mensajes.</p>
    {!generated ? <>
      <h2 className="text-lg font-semibold">Revisar pedido · {label}</h2>
      {products.map(product => <section key={product.id} className="space-y-2 rounded-xl border p-3">
        <h3 className="font-semibold">{product.name}</h3>
        <p className="text-sm">Stock: {product.comparison.stock ?? "Sin revisar"} · Objetivo: {product.comparison.target ?? "Sin definir"} · Pedido: {product.comparison.shortage ?? "Pendiente"} {product.unit}</p>
        {product.comparison.issues.map(issue => <p key={issue} className="text-sm text-amber-800">{issues[issue]}</p>)}
        {product.comparison.shortage !== null && product.comparison.shortage !== "0" && (product.suppliers.length === 0 ? <p className="text-sm text-amber-800">Sin proveedor: queda fuera del pedido.</p> : product.suppliers.length === 1 ? <p className="text-sm">{product.suppliers[0]?.name}</p> : <label className="block text-sm">Elegir proveedor<Select value={choices[product.id] ?? ""} onChange={event => { setChoices(current => ({ ...current, [product.id]: event.target.value })); setConfirmed(false); }}><option value="">Seleccioná un proveedor</option>{product.suppliers.map(supplier => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</Select></label>)}
      </section>)}
      {providerLink}
      <p className="text-sm">{groups.groups.length} proveedores · {groups.unresolved.length} productos pendientes excluidos · {groups.noPurchase.length} sin faltante.</p>
      <label className="flex min-h-11 items-start gap-3 rounded-xl border p-3"><input className="mt-1 h-5 w-5 shrink-0" type="checkbox" checked={confirmed} onChange={event => { setConfirmed(event.target.checked); }} /><span className="text-sm">Revisé fecha, cantidades, unidades y proveedores. Confirmo generar el informe con los productos resueltos; los pendientes quedan excluidos.</span></label>
      <Button disabled={!confirmed || groups.groups.length === 0} onClick={() => { setGenerated(true); }}>Confirmar y generar pedidos</Button>
    </> : <>
      <Button variant="secondary" onClick={() => { setGenerated(false); setConfirmed(false); setFeedback(null); }}>Volver a revisar</Button>
      <FormMessage tone="success" message={feedback} /><FormMessage message={copyError} />
      {groups.groups.map(group => <section key={group.supplier.id} className="space-y-3 rounded-xl border p-4">
        <h2 className="text-lg font-semibold">{group.supplier.name}</h2>
        <Textarea aria-label={`Pedido para ${group.supplier.name}`} readOnly rows={Math.max(3, group.products.length)} value={orderMessage(group)} />
        <Button onClick={() => { void copy(orderMessage(group), group.supplier.name); }}>Copiar pedido</Button>
      </section>)}
      {providerLink}
      {groups.unresolved.length > 0 && <p className="text-sm text-amber-800">Fuera de estos pedidos: {groups.unresolved.map(product => product.name).join(", ")}. Revisalos antes de completar la compra.</p>}
    </>}
  </div>;
}
