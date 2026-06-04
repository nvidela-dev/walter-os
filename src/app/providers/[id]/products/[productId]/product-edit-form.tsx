"use client";

import { useRouter } from "next/navigation";
import type { ReactElement } from "react";

import { FormMessage } from "@/components/form-feedback";
import { useActionForm } from "@/components/hooks/use-action-form";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { t } from "@/i18n";
import { updateProduct } from "@/lib/actions/products";
import { getFormString } from "@/lib/form";
import type { ProductForProvider, UnitOption } from "@/lib/types/providers";

export function ProductEditForm({
  providerId,
  productId,
  product,
  units,
}: {
  providerId: string;
  productId: string;
  product: ProductForProvider;
  units: UnitOption[];
}): ReactElement {
  const router = useRouter();
  const { error, isSubmitting, runAction } = useActionForm();

  const defaultUnitId =
    product.unitId ??
    units.find((u) => u.code === "unidad")?.id ??
    units[0]?.id ??
    "";

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const data = {
      name: getFormString(formData, "name"),
      unitId: getFormString(formData, "unitId"),
      price: getFormString(formData, "price"),
    };

    const result = await runAction(() => updateProduct(providerId, productId, data));
    if (!result.ok) return;
    router.push(`/providers/${providerId}`);
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
      <FormMessage message={error} />
      <FormField htmlFor="product-name" label={t.products.fields.name}>
        <Input
          type="text"
          id="product-name"
          name="name"
          required
          defaultValue={product.name}
        />
      </FormField>

      <FormField htmlFor="product-unit" label={t.products.fields.unit}>
        <Select
          id="product-unit"
          name="unitId"
          defaultValue={defaultUnitId}
        >
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField htmlFor="product-price" label={t.products.fields.price}>
        <Input
          type="number"
          id="product-price"
          name="price"
          step="0.01"
          required
          defaultValue={product.price}
        />
      </FormField>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-4 text-base"
      >
        {isSubmitting ? t.common.saving : t.common.saveChanges}
      </Button>
    </form>
  );
}
