"use client";

import type { ReactElement, SyntheticEvent } from "react";

import { FormMessage } from "@/components/form-feedback";
import { useActionForm } from "@/components/hooks/use-action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { t } from "@/i18n";
import { linkExistingProduct } from "@/lib/actions/products";
import { getFormString } from "@/lib/form";

export function LinkProductForm({ providerId, products }: { providerId: string; products: { id: string; name: string; unit: string }[] }): ReactElement {
  const { error, isSubmitting, runAction } = useActionForm();
  async function submit(event: SyntheticEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const result = await runAction(() => linkExistingProduct({ providerId, productId: getFormString(data, "productId"), price: getFormString(data, "price"), quantity: getFormString(data, "quantity") }));
    if (result.ok) form.reset();
  }
  return <details className="mt-4 rounded-xl bg-white p-4"><summary>{t.inventory.linkProduct}</summary>
    <form onSubmit={(event) => void submit(event)} className="mt-4 space-y-3">
      <FormMessage message={error} />
      <Select name="productId" aria-label={t.inventory.chooseProduct} required defaultValue="">
        <option value="" disabled>{t.inventory.chooseProduct}</option>
        {products.map((product) => <option key={product.id} value={product.id}>{product.name} ({product.unit})</option>)}
      </Select>
      <label className="block">{t.products.fields.price}<Input name="price" type="number" min="0.01" step="0.01" required /></label>
      <label className="block">{t.products.fields.packQuantity}<Input name="quantity" type="number" min="0.01" step="0.01" defaultValue="1" required /></label>
      <Button type="submit" disabled={isSubmitting || products.length === 0}>{t.inventory.linkProduct}</Button>
    </form>
  </details>;
}
