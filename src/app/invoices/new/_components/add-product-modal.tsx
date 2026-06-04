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
import { createProductForProvider } from "@/lib/actions/products";
import type { InvoiceFormProduct } from "@/lib/types/invoices";
import type { UnitOption } from "@/lib/types/providers";

export function AddProductModal({
  onClose,
  onCreated,
  providerId,
  providerName,
  units,
}: {
  onClose: () => void;
  onCreated: (product: InvoiceFormProduct) => void;
  providerId: string;
  providerName: string;
  units: UnitOption[];
}): ReactElement {
  const [name, setName] = useState("");
  const [unitId, setUnitId] = useState(units[0]?.id ?? "");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const { error, isSubmitting, runAction, setError } = useActionForm(
    t.invoices.errors.productCreateFailed
  );
  const hint = t.products.addHint(providerName);

  async function handleSave(): Promise<void> {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t.invoices.errors.nameRequired);
      return;
    }
    if (!unitId) {
      setError(t.invoices.errors.selectUnit);
      return;
    }
    const priceNumber = Number(price);
    if (!isFinite(priceNumber) || priceNumber <= 0) {
      setError(t.invoices.errors.invalidPrice);
      return;
    }
    const quantityNumber = Number(quantity);
    if (!isFinite(quantityNumber) || quantityNumber <= 0) {
      setError(t.invoices.errors.invalidQuantity);
      return;
    }

    const result = await runAction(() =>
      createProductForProvider(
        providerId,
        { name: trimmed, description: null, unitId },
        price,
        quantity
      )
    );
    if (!result.ok) return;

    const unit = units.find((entry) => entry.id === unitId);
    onCreated({
      id: result.data.id,
      name: result.data.name,
      unitId,
      unitCode: unit?.code ?? "",
      currentPrice: price,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium text-[#3d3530]">{t.products.newTitle}</h3>
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

        <p className="mb-4 text-sm text-[#8b7355]">
          {hint.before}
          <span className="font-medium text-[#3d3530]">{hint.name}</span>
          {hint.after}
        </p>

        <FormField className="mb-4" htmlFor="new-product-name" label={t.products.fields.name}>
          <Input
            id="new-product-name"
            type="text"
            value={name}
            onChange={(event) => { setName(event.target.value); }}
            disabled={isSubmitting}
            autoFocus
          />
        </FormField>

        <FormField className="mb-4" htmlFor="new-product-unit" label={t.invoices.fields.unit}>
          <Select
            id="new-product-unit"
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

        <div className="mb-6 grid grid-cols-2 gap-3">
          <FormField htmlFor="new-product-price" label={t.invoices.fields.unitPrice}>
            <Input
              id="new-product-price"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={price}
              onChange={(event) => { setPrice(event.target.value); }}
              disabled={isSubmitting}
            />
          </FormField>
          <FormField htmlFor="new-product-quantity" label={t.products.fields.packQuantity}>
            <Input
              id="new-product-quantity"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={quantity}
              onChange={(event) => { setQuantity(event.target.value); }}
              disabled={isSubmitting}
            />
          </FormField>
        </div>

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
            {isSubmitting ? t.common.saving : t.products.createAndUse}
          </Button>
        </div>
      </div>
    </div>
  );
}
