"use client";

import Link from "next/link";
import { type ReactElement, useState } from "react";

import { FormMessage } from "@/components/form-feedback";
import { t } from "@/i18n";
import { removeProductFromProvider } from "@/lib/actions/products";

interface Product {
  id: string;
  productId: string;
  name: string;
  unit: string;
  price: string;
  quantity: string;
  description: string | null;
}

export function ProductList({
  products,
  providerId,
}: {
  products: Product[];
  providerId: string;
}): ReactElement {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(e: React.MouseEvent, productId: string): Promise<void> {
    e.preventDefault();
    e.stopPropagation();
    setDeletingId(productId);
    setError(null);
    try {
      const result = await removeProductFromProvider(providerId, productId);
      if (!result.ok) {
        setError(result.error);
      }
    } catch {
      setError(t.errors.generic);
    } finally {
      setDeletingId(null);
    }
  }

  if (products.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-[#8b7355]">
        {t.products.emptyHint}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <FormMessage message={error} />
      {products.map((product) => (
        <Link
          key={product.productId}
          href={`/providers/${providerId}/products/${product.productId}`}
          className="flex items-center justify-between rounded-xl bg-white p-4 transition-colors hover:bg-[#faf8f5] active:scale-[0.99]"
        >
          <div className="flex-1">
            <p className="font-medium text-[#3d3530]">{product.name}</p>
            <p className="text-sm text-[#8b7355]">
              ${product.price} / {product.unit}
            </p>
          </div>
          <button
            onClick={(e) => void handleDelete(e, product.productId)}
            disabled={deletingId === product.productId}
            className="rounded-full p-2 text-[#c4a77d] hover:bg-[#f5f0e8] disabled:opacity-50"
          >
            {deletingId === product.productId ? t.common.loading : "×"}
          </button>
        </Link>
      ))}
    </div>
  );
}
