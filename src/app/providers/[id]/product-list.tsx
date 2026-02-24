"use client";

import Link from "next/link";
import { useState } from "react";
import { removeProductFromProvider } from "../actions";

interface Product {
  id: string;
  productoId: string;
  nombre: string;
  unidad: string;
  precio: string;
  cantidad: string;
  descripcion: string | null;
}

export function ProductList({ products, providerId }: { products: Product[]; providerId: string }) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(e: React.MouseEvent, productoId: string) {
    e.preventDefault();
    e.stopPropagation();
    setDeletingId(productoId);
    await removeProductFromProvider(providerId, productoId);
    setDeletingId(null);
  }

  if (products.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-[#8b7355]">
        Sin productos. Agrega uno abajo.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {products.map((product) => (
        <Link
          key={product.productoId}
          href={`/providers/${providerId}/products/${product.productoId}`}
          className="flex items-center justify-between rounded-xl bg-white p-4 transition-colors hover:bg-[#faf8f5] active:scale-[0.99]"
        >
          <div className="flex-1">
            <p className="font-medium text-[#3d3530]">{product.nombre}</p>
            <p className="text-sm text-[#8b7355]">
              ${product.precio} / {product.unidad}
            </p>
          </div>
          <button
            onClick={(e) => handleDelete(e, product.productoId)}
            disabled={deletingId === product.productoId}
            className="rounded-full p-2 text-[#c4a77d] hover:bg-[#f5f0e8] disabled:opacity-50"
          >
            {deletingId === product.productoId ? "..." : "×"}
          </button>
        </Link>
      ))}
    </div>
  );
}
