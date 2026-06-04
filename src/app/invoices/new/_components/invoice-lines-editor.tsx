import { PencilSquareIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { t } from "@/i18n";
import type { InvoiceFormProduct } from "@/lib/types/invoices";

import { type InvoiceLineDraft,NEW_PRODUCT_VALUE } from "./types";

export function InvoiceLinesEditor({
  addLine,
  lines,
  products,
  providerSelected,
  removeLine,
  selectProduct,
  setEditingLineIdx,
  updateLine,
}: {
  addLine: () => void;
  lines: InvoiceLineDraft[];
  products: InvoiceFormProduct[];
  providerSelected: boolean;
  removeLine: (idx: number) => void;
  selectProduct: (idx: number, productId: string) => void;
  setEditingLineIdx: (idx: number) => void;
  updateLine: (idx: number, patch: Partial<InvoiceLineDraft>) => void;
}): ReactElement {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-medium text-[#8b7355]">{t.invoices.lines.heading}</h2>
        <span className="text-xs text-[#c4a77d]">{t.invoices.lines.count(lines.length)}</span>
      </div>

      {lines.map((line, idx) => {
        const product = products.find((entry) => entry.id === line.productId);
        const isNewPrice =
          !!product &&
          !!line.unitPrice &&
          Number(line.unitPrice) !== Number(product.currentPrice);
        const lineTotal = Number(line.unitPrice || 0) * Number(line.quantity || 0);
        const productId = `invoice-product-${idx}`;
        const quantityId = `invoice-quantity-${idx}`;
        const unitId = `invoice-unit-${idx}`;
        const priceId = `invoice-price-${idx}`;

        return (
          <div key={idx} className="space-y-3 rounded-xl bg-white p-4">
            <div className="flex items-start gap-2">
              <FormField className="flex-1" htmlFor={productId} label={t.invoices.fields.product}>
                <Select
                  id={productId}
                  required
                  disabled={!providerSelected}
                  value={line.productId}
                  onChange={(event) => { selectProduct(idx, event.target.value); }}
                >
                  <option value="">
                    {providerSelected
                      ? t.invoices.fields.productPlaceholder
                      : t.invoices.fields.pickProviderFirst}
                  </option>
                  {products.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.name}
                    </option>
                  ))}
                  {providerSelected && (
                    <option value={NEW_PRODUCT_VALUE}>{t.invoices.addProductOption}</option>
                  )}
                </Select>
              </FormField>
              <div className="mt-7 flex gap-2">
                {product && (
                  <Button
                    type="button"
                    onClick={() => { setEditingLineIdx(idx); }}
                    aria-label={t.invoices.editProduct.title}
                    title={t.invoices.editProduct.title}
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12"
                  >
                    <PencilSquareIcon className="h-5 w-5" />
                  </Button>
                )}
                {lines.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => { removeLine(idx); }}
                    aria-label={t.invoices.lines.remove}
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <FormField htmlFor={quantityId} label={t.invoices.fields.quantity}>
                <Input
                  id={quantityId}
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  required
                  value={line.quantity}
                  onChange={(event) => { updateLine(idx, { quantity: event.target.value }); }}
                  className="px-3"
                />
              </FormField>
              <FormField htmlFor={unitId} label={t.invoices.fields.unit}>
                <Input
                  id={unitId}
                  type="text"
                  readOnly
                  value={product?.unitCode ?? "—"}
                  className="bg-[#faf8f5] px-3 text-[#8b7355]"
                />
              </FormField>
              <FormField htmlFor={priceId} label={t.invoices.fields.unitPrice}>
                <Input
                  id={priceId}
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  required
                  disabled={!product}
                  value={line.unitPrice}
                  onChange={(event) => { updateLine(idx, { unitPrice: event.target.value }); }}
                  className="px-3"
                />
              </FormField>
            </div>

            <div className="flex items-center justify-between border-t border-[#f5f0e8] pt-3 text-sm">
              <div className="text-[#8b7355]">
                {isNewPrice && (
                  <span className="text-amber-700">
                    {t.invoices.lines.newPrice(product.currentPrice)}
                  </span>
                )}
              </div>
              <div className="font-medium text-[#3d3530]">
                {t.invoices.lines.subtotal(lineTotal.toFixed(2))}
              </div>
            </div>
          </div>
        );
      })}

      <Button
        type="button"
        onClick={addLine}
        disabled={!providerSelected}
        variant="secondary"
        className="w-full border-dashed border-[#c4a77d] py-3 text-sm text-[#c4a77d] hover:bg-white"
      >
        <PlusIcon className="h-4 w-4" />
        {t.invoices.lines.add}
      </Button>
    </section>
  );
}
