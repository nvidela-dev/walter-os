"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createProvider, updateProvider } from "./actions";
import type { Proveedor } from "@/db/schema";

interface ProviderFormProps {
  provider?: Proveedor;
}

export function ProviderForm({ provider }: ProviderFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!provider;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      nombre: formData.get("nombre") as string,
      descripcion: (formData.get("descripcion") as string) || null,
      deuda: formData.get("deuda") as string || "0",
    };

    if (isEditing) {
      await updateProvider(provider.id, data);
    } else {
      await createProvider(data);
    }
    router.push("/providers");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="nombre" className="mb-2 block text-lg font-medium text-gray-700">Provider Name *</label>
        <input type="text" id="nombre" name="nombre" required defaultValue={provider?.nombre}
          placeholder="e.g., Costco, Local Farm..."
          className="w-full rounded-xl border-2 border-gray-200 px-4 py-4 text-lg focus:border-blue-500 focus:outline-none" />
      </div>

      <div>
        <label htmlFor="deuda" className="mb-2 block text-lg font-medium text-gray-700">Current Debt ($)</label>
        <input type="number" id="deuda" name="deuda" step="0.01" defaultValue={provider?.deuda ?? "0"}
          className="w-full rounded-xl border-2 border-gray-200 px-4 py-4 text-lg focus:border-blue-500 focus:outline-none" />
        <p className="mt-1 text-sm text-gray-500">How much do you owe this provider?</p>
      </div>

      <div>
        <label htmlFor="descripcion" className="mb-2 block text-lg font-medium text-gray-700">Description (optional)</label>
        <textarea id="descripcion" name="descripcion" rows={3} defaultValue={provider?.descripcion ?? ""}
          placeholder="Add any notes..."
          className="w-full rounded-xl border-2 border-gray-200 px-4 py-4 text-lg focus:border-blue-500 focus:outline-none" />
      </div>

      <button type="submit" disabled={isSubmitting}
        className="w-full rounded-xl bg-blue-500 py-4 text-xl font-semibold text-white shadow-lg active:scale-[0.98] disabled:opacity-50">
        {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Add Provider"}
      </button>
    </form>
  );
}
