"use client";

import type { ReactElement } from "react";

import type { InvoiceFormProvider } from "@/lib/types/invoices";
import type { UnitOption } from "@/lib/types/providers";

import { AddProductModal } from "./_components/add-product-modal";
import { EditProductModal } from "./_components/edit-product-modal";
import { InvoiceDetailsSection } from "./_components/invoice-details-section";
import { InvoiceLinesEditor } from "./_components/invoice-lines-editor";
import { InvoiceSummary } from "./_components/invoice-summary";
import { ServiceAmountSection } from "./_components/service-amount-section";
import { useInvoiceForm } from "./_hooks/use-invoice-form";

export function InvoiceForm({
  providers,
  units,
}: {
  providers: InvoiceFormProvider[];
  units: UnitOption[];
}): ReactElement {
  const form = useInvoiceForm(providers);
  const editingLineIdx = form.editingLineIdx;
  const creatingLineIdx = form.creatingLineIdx;
  const editingLine =
    editingLineIdx !== null ? form.lines[editingLineIdx] : undefined;
  const editingProduct = editingLine
    ? form.products.find((product) => product.id === editingLine.productId)
    : undefined;

  return (
    <form onSubmit={form.handleSubmit} className="space-y-4">
      <InvoiceDetailsSection
        changeProvider={form.changeProvider}
        changeType={form.changeType}
        date={form.date}
        notes={form.notes}
        number={form.number}
        providerId={form.providerId}
        setDate={form.setDate}
        setNotes={form.setNotes}
        setNumber={form.setNumber}
        type={form.type}
        visibleProviders={form.visibleProviders}
      />

      {form.type === "servicio" && (
        <ServiceAmountSection
          amount={form.amount}
          disabled={!form.provider}
          setAmount={form.setAmount}
        />
      )}

      {form.type === "producto" && (
        <InvoiceLinesEditor
          addLine={form.addLine}
          lines={form.lines}
          products={form.products}
          providerSelected={!!form.provider}
          removeLine={form.removeLine}
          selectProduct={form.selectProduct}
          setEditingLineIdx={form.setEditingLineIdx}
          updateLine={form.updateLine}
        />
      )}

      <InvoiceSummary error={form.error} isPending={form.isPending} total={form.total} />

      {editingLineIdx !== null && form.provider && editingLine && editingProduct && (
        <EditProductModal
          providerId={form.provider.id}
          product={editingProduct}
          units={units}
          initialPrice={editingLine.unitPrice || editingProduct.currentPrice}
          onClose={() => { form.setEditingLineIdx(null); }}
          onSaved={(newPrice) => { form.handleProductSaved(editingLineIdx, newPrice); }}
        />
      )}

      {creatingLineIdx !== null && form.provider && (
        <AddProductModal
          providerId={form.provider.id}
          providerName={form.provider.name}
          units={units}
          onClose={() => { form.setCreatingLineIdx(null); }}
          onCreated={(product) => { form.handleProductCreated(creatingLineIdx, product); }}
        />
      )}
    </form>
  );
}
