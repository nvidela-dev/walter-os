"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { type ReactElement, useState } from "react";

import { FormMessage } from "@/components/form-feedback";
import { useActionForm } from "@/components/hooks/use-action-form";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { t } from "@/i18n";
import { updateProduct } from "@/lib/actions/products";
import type { InvoiceFormProduct } from "@/lib/types/invoices";
import type { UnitOption } from "@/lib/types/providers";

export function EditProductModal({
  initialPrice,
  onClose,
  onSaved,
  product,
  providerId,
  units,
}: {
  initialPrice: string;
  onClose: () => void;
  onSaved: (newPrice: string) => void;
  product: InvoiceFormProduct;
  providerId: string;
  units: UnitOption[];
}): ReactElement {
  const [unitId, setUnitId] = useState(product.unitId);
  const [price, setPrice] = useState(initialPrice);
  const { error, isSubmitting, runAction, setError } = useActionForm(
    t.invoices.errors.saveFailed
  );

  async function handleSave(): Promise<void> {
    const priceNumber = Number(price);
    if (!isFinite(priceNumber) || priceNumber <= 0) {
      setError(t.invoices.errors.invalidPrice);
      return;
    }
    if (!unitId) {
      setError(t.invoices.errors.selectUnit);
      return;
    }

    const result = await runAction(() =>
      updateProduct(providerId, product.id, {
        name: product.name,
        unitId,
        price,
      })
    );
    if (!result.ok) return;
    onSaved(price);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium text-[#3d3530]">{t.invoices.editProduct.title}</h3>
          <Button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label={t.common.close}
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
          >
            <XMarkIcon className="h-5 w-5" />
          </Button>
        </div>

        <p className="mb-4 text-sm text-[#8b7355]">{t.invoices.editProduct.hint}</p>

        <div className="mb-4">
          <p className="mb-2 text-xs font-medium text-[#8b7355]">{t.invoices.fields.product}</p>
          <p className="rounded-xl bg-[#faf8f5] px-4 py-3 text-sm text-[#3d3530]">
            {product.name}
          </p>
        </div>

        <FormField className="mb-4" htmlFor="modal-unit" label={t.invoices.fields.unit}>
          <Select
            id="modal-unit"
            value={unitId}
            onChange={(event) => { setUnitId(event.target.value); }}
            disabled={isSubmitting}
          >
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          className="mb-6"
          htmlFor="modal-price"
          label={t.invoices.fields.unitPriceFull}
        >
          <Input
            id="modal-price"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={price}
            onChange={(event) => { setPrice(event.target.value); }}
            disabled={isSubmitting}
          />
        </FormField>

        <FormMessage message={error} className="mb-3" />

        <div className="flex gap-2">
          <Button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            variant="secondary"
            className="flex-1 py-3 text-sm"
          >
            {t.common.cancel}
          </Button>
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSubmitting}
            className="flex-1 py-3 text-sm"
          >
            {isSubmitting ? t.common.saving : t.common.save}
          </Button>
        </div>
      </div>
    </div>
  );
}
