"use client";

import Link from "next/link";
import { type ReactElement,useState } from "react";

import { FormMessage } from "@/components/form-feedback";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { orderMessage } from "@/lib/inventory/order-message";
import { groupInventoryPurchases, type PurchaseProduct, type PurchaseSupplier } from "@/lib/inventory/purchases";

// Stable catalogue identity: changing the provider's display name must not turn
// internal preparation into an external purchase.
const productionProviderId = "3e9af935-c777-4357-bf41-fa24a9c3949a";
const isProduction = (supplier: PurchaseSupplier | undefined): boolean => supplier?.id === productionProviderId;
const supplierLabel = (supplier: PurchaseSupplier): string => isProduction(supplier) ? "Producción" : supplier.name;

export function OrderReport({ products, label, date }: { products: PurchaseProduct[]; label: string; date: string }): ReactElement {
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  async function copy(text: string, success: string): Promise<void> {
    setFeedback(null); setCopyError(null);
    try { await navigator.clipboard.writeText(text); setFeedback(success); }
    catch { setCopyError("No se pudo copiar automáticamente. Seleccioná el texto del pedido y copialo."); }
  }
  const groups = groupInventoryPurchases(products, choices);
  const purchaseGroups = groups.groups.filter(group => !isProduction(group.supplier));
  const productionGroups = groups.groups.filter(group => isProduction(group.supplier));
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
        <p className="text-sm">Stock: {product.comparison.stock ?? "Sin revisar"} · Objetivo: {product.comparison.target ?? "Sin definir"} · {product.suppliers.length === 1 && isProduction(product.suppliers[0]) ? "A producir" : "Pedido"}: {product.comparison.shortage ?? "Pendiente"} {product.unit}</p>
        {product.comparison.issues.map(issue => <p key={issue} className="text-sm text-amber-800">{issues[issue]}</p>)}
        {product.comparison.shortage !== null && product.comparison.shortage !== "0" && (product.suppliers.length === 0 ? <p className="text-sm text-amber-800">Sin proveedor: queda fuera del pedido.</p> : product.suppliers.length === 1 ? <p className="text-sm">{product.suppliers[0] ? supplierLabel(product.suppliers[0]) : ""}</p> : <label className="block text-sm">Elegir proveedor<Select value={choices[product.id] ?? ""} onChange={event => { setChoices(current => ({ ...current, [product.id]: event.target.value })); setConfirmed(false); }}><option value="">Seleccioná un proveedor</option>{product.suppliers.map(supplier => <option key={supplier.id} value={supplier.id}>{supplierLabel(supplier)}</option>)}</Select></label>)}
      </section>)}
      {providerLink}
      <p className="text-sm">{purchaseGroups.length} proveedores · {productionGroups.reduce((total, group) => total + group.products.length, 0)} productos para producción interna · {groups.unresolved.length} productos pendientes excluidos · {groups.noPurchase.length} sin faltante.</p>
      <label className="flex min-h-11 items-start gap-3 rounded-xl border p-3"><input className="mt-1 h-5 w-5 shrink-0" type="checkbox" checked={confirmed} onChange={event => { setConfirmed(event.target.checked); }} /><span className="text-sm">Revisé fecha, cantidades, unidades y proveedores. Confirmo generar el informe con los productos resueltos; los pendientes quedan excluidos.</span></label>
      <Button disabled={!confirmed || groups.groups.length === 0} onClick={() => { setGenerated(true); }}>Confirmar y generar pedidos</Button>
    </> : <>
      <Button variant="secondary" onClick={() => { setGenerated(false); setConfirmed(false); setFeedback(null); }}>Volver a revisar</Button>
      <FormMessage tone="success" message={feedback} /><FormMessage message={copyError} />
      {purchaseGroups.map(group => <section key={group.supplier.id} className="space-y-3 rounded-xl border p-4">
        <h2 className="text-lg font-semibold">{group.supplier.name}</h2>
        <Textarea aria-label={`Pedido para ${group.supplier.name}`} readOnly rows={Math.max(3, group.products.length)} value={orderMessage(group)} />
        <Button onClick={() => { void copy(orderMessage(group), `Pedido de ${group.supplier.name} copiado.`); }}>Copiar pedido</Button>
      </section>)}
      {productionGroups.map(group => <section key={group.supplier.id} aria-label="Producción interna" className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <h2 className="text-lg font-semibold">Producción</h2>
        <p className="text-sm text-muted">Preparación interna · cantidades a producir según el faltante del inventario.</p>
        <Textarea aria-label="Lista de producción" readOnly rows={Math.max(3, group.products.length + 1)} value={`Producción interna\n${orderMessage(group)}`} />
        <Button onClick={() => { void copy(`Producción interna\n${orderMessage(group)}`, "Lista de producción copiada."); }}>Copiar producción</Button>
      </section>)}
      {providerLink}
      {groups.unresolved.length > 0 && <p className="text-sm text-amber-800">Fuera de estos pedidos: {groups.unresolved.map(product => product.name).join(", ")}. Revisalos antes de completar la compra.</p>}
    </>}
  </div>;
}
