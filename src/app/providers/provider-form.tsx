"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createProvider, updateProvider } from "./actions";
import type { Proveedor } from "@/db/schema";

export function ProviderForm({ provider }: { provider?: Proveedor }) {
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
      router.push(`/providers/${provider.id}`);
    } else {
      const newProvider = await createProvider(data);
      router.push(`/providers/${newProvider.id}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="nombre" className="mb-2 block text-sm font-medium text-[#3d3530]">Provider Name</label>
        <input type="text" id="nombre" name="nombre" required defaultValue={provider?.nombre}
          placeholder="Enter name..."
          className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-4 text-[#3d3530] placeholder:text-[#c4a77d] focus:border-[#c4a77d] focus:outline-none" />
      </div>

      <div>
        <label htmlFor="deuda" className="mb-2 block text-sm font-medium text-[#3d3530]">Current Debt ($)</label>
        <input type="number" id="deuda" name="deuda" step="0.01" defaultValue={provider?.deuda ?? "0"}
          className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-4 text-[#3d3530] focus:border-[#c4a77d] focus:outline-none" />
      </div>

      <div>
        <label htmlFor="descripcion" className="mb-2 block text-sm font-medium text-[#3d3530]">Notes</label>
        <textarea id="descripcion" name="descripcion" rows={3} defaultValue={provider?.descripcion ?? ""}
          placeholder="Optional notes..."
          className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-4 text-[#3d3530] placeholder:text-[#c4a77d] focus:border-[#c4a77d] focus:outline-none" />
      </div>

      <button type="submit" disabled={isSubmitting}
        className="w-full rounded-xl bg-[#c4a77d] py-4 text-base font-medium text-white shadow-sm active:scale-[0.99] disabled:opacity-50">
        {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Create Provider"}
      </button>
    </form>
  );
}
