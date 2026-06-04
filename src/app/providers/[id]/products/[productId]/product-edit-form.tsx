"use client";

import { useRouter } from "next/navigation";
import { type ReactElement, useState } from "react";

import { FormMessage } from "@/components/form-feedback";
import { t } from "@/i18n";
import { getFormString } from "@/lib/form";

import { updateProduct } from "../../../actions";

interface Product {
  id: string;
  name: string;
  unitId: string | null;
  price: string;
  description: string | null;
}

interface UnitOption {
  id: string;
  code: string;
  name: string;
}

export function ProductEditForm({
  providerId,
  productId,
  product,
  units,
}: {
  providerId: string;
  productId: string;
  product: Product;
  units: UnitOption[];
}): ReactElement {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultUnitId =
    product.unitId ??
    units.find((u) => u.code === "unidad")?.id ??
    units[0]?.id ??
    "";

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: getFormString(formData, "name"),
      unitId: getFormString(formData, "unitId"),
      price: getFormString(formData, "price"),
    };

    const result = await updateProduct(providerId, productId, data);
    if (!result.ok) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }
    router.push(`/providers/${providerId}`);
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
      <FormMessage message={error} />
      <div>
        <label htmlFor="name" className="mb-2 block text-xs font-medium text-[#8b7355]">{t.products.fields.name}</label>
        <input
          type="text"
          id="name"
          name="name"
          required
          defaultValue={product.name}
          className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-3 text-sm text-[#3d3530] focus:border-[#c4a77d] focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="unitId" className="mb-2 block text-xs font-medium text-[#8b7355]">{t.products.fields.unit}</label>
        <select
          id="unitId"
          name="unitId"
          defaultValue={defaultUnitId}
          className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-3 text-sm text-[#3d3530] focus:border-[#c4a77d] focus:outline-none"
        >
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="price" className="mb-2 block text-xs font-medium text-[#8b7355]">{t.products.fields.price}</label>
        <input
          type="number"
          id="price"
          name="price"
          step="0.01"
          required
          defaultValue={product.price}
          className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-3 text-sm text-[#3d3530] focus:border-[#c4a77d] focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-[#c4a77d] py-4 text-base font-medium text-white shadow-sm active:scale-[0.99] disabled:opacity-50"
      >
        {isSubmitting ? t.common.saving : t.common.saveChanges}
      </button>
    </form>
  );
}
