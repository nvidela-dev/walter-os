"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createProduct, updateProduct } from "./actions";
import type { Producto } from "@/db/schema";

const UNITS = [
  { value: "unidad", label: "Unit (each)" },
  { value: "kg", label: "Kilogram (kg)" },
  { value: "g", label: "Gram (g)" },
  { value: "litro", label: "Liter (L)" },
  { value: "ml", label: "Milliliter (ml)" },
  { value: "docena", label: "Dozen" },
  { value: "paquete", label: "Package" },
];

interface ProductFormProps {
  product?: Producto;
}

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!product;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      nombre: formData.get("nombre") as string,
      descripcion: (formData.get("descripcion") as string) || null,
      unidad: formData.get("unidad") as string,
    };

    try {
      if (isEditing) {
        await updateProduct(product.id, data);
      } else {
        await createProduct(data);
      }
      router.push("/products");
    } catch {
      setError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-red-700">{error}</div>
      )}

      {/* Name */}
      <div>
        <label
          htmlFor="nombre"
          className="mb-2 block text-lg font-medium text-gray-700"
        >
          Product Name *
        </label>
        <input
          type="text"
          id="nombre"
          name="nombre"
          required
          defaultValue={product?.nombre}
          placeholder="e.g., Tomatoes, Chicken, Rice..."
          className="w-full rounded-xl border-2 border-gray-200 px-4 py-4 text-lg focus:border-green-500 focus:outline-none"
        />
        <p className="mt-1 text-sm text-gray-500">
          Enter the name of the product
        </p>
      </div>

      {/* Unit */}
      <div>
        <label
          htmlFor="unidad"
          className="mb-2 block text-lg font-medium text-gray-700"
        >
          Unit of Measure *
        </label>
        <select
          id="unidad"
          name="unidad"
          required
          defaultValue={product?.unidad ?? "unidad"}
          className="w-full rounded-xl border-2 border-gray-200 px-4 py-4 text-lg focus:border-green-500 focus:outline-none"
        >
          {UNITS.map((unit) => (
            <option key={unit.value} value={unit.value}>
              {unit.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-gray-500">
          How is this product measured?
        </p>
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="descripcion"
          className="mb-2 block text-lg font-medium text-gray-700"
        >
          Description (optional)
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          rows={3}
          defaultValue={product?.descripcion ?? ""}
          placeholder="Add any notes about this product..."
          className="w-full rounded-xl border-2 border-gray-200 px-4 py-4 text-lg focus:border-green-500 focus:outline-none"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-green-500 py-4 text-xl font-semibold text-white shadow-lg active:scale-[0.98] disabled:opacity-50"
      >
        {isSubmitting
          ? "Saving..."
          : isEditing
            ? "Save Changes"
            : "Add Product"}
      </button>
    </form>
  );
}
