import type { ReactElement } from "react";

import { Input } from "@/components/ui/input";
import { reviewedTotalMatches } from "@/lib/invoice-photo/review";
import type { ExtractedInvoice } from "@/lib/invoice-photo/schema";

import type { InvoiceFormController } from "../_hooks/use-invoice-form";

export function PhotoReview({ form, photo }: { form: InvoiceFormController; photo: ExtractedInvoice }): ReactElement {
  const matches = reviewedTotalMatches(form.type === "servicio" ? form.amount : form.lines, form.reviewedTotal);
  return <section className="space-y-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm">
    <h2 className="font-semibold">Revisión obligatoria de la foto</h2>
    <p>Proveedor leído: {photo.supplier ?? "Desconocido"}. Las coincidencias por nombre son sugerencias; confirmá el proveedor y cada producto.</p>
    <p>Total leído: {photo.total ?? "Desconocido"} · Moneda: {photo.currency ?? "Desconocida"}</p>
    <p>Impuestos: {photo.tax ?? "No identificados"} · Descuento: {photo.discount ?? "No identificado"}</p>
    {photo.adjustments !== null && <p>{photo.adjustments}</p>}
    {photo.warnings.map((warning, index) => <p key={index} role="note">⚠ {warning}</p>)}
    <p>El sistema guarda importes en pesos uruguayos y calcula el total de productos con cantidad × precio. No tiene campos separados de IVA, descuentos ni otras monedas. No cambies precios para ocultar una diferencia: si la factura no se puede representar fielmente, no la guardes. Los precios guardados actualizan el catálogo y su historial; la deuda sigue manual.</p>
    <label htmlFor="photo-total" className="block font-medium">Total final verificado en la factura (UYU)</label>
    <Input id="photo-total" type="number" inputMode="decimal" step="0.01" min="0.01" required value={form.reviewedTotal} onChange={(event) => { form.setReviewedTotal(event.target.value); }} />
    {!matches && <p role="alert" className="font-medium text-red-700">El total del formulario no coincide con el total verificado. Completá o corregí los datos antes de guardar.</p>}
    <label className="flex items-start gap-3 py-3">
      <input type="checkbox" className="mt-1 h-5 w-5 shrink-0" checked={form.reviewed} disabled={!matches || form.isPending} onChange={(event) => { form.setReviewed(event.target.checked); }} />
      <span>Revisé la foto completa, proveedor, fecha, número, productos, unidades, cantidades y precios. Confirmo que son pesos uruguayos y que el total incluye correctamente los impuestos y descuentos. No faltan páginas ni líneas.</span>
    </label>
    <p className="text-xs">Si cambiás algún dato, debés confirmar la revisión otra vez. La foto y los datos de lectura no se conservan al salir; guardá cualquier aclaración necesaria en Notas.</p>
  </section>;
}
