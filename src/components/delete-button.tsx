"use client";

import { useRouter } from "next/navigation";
import { type ReactElement, useState } from "react";

import type { ActionResult } from "@/lib/action-result";

import { FormMessage } from "./form-feedback";

interface DeleteButtonProps {
  id: string;
  name: string;
  deleteAction: (id: string) => Promise<ActionResult>;
  redirectTo: string;
}

export function DeleteButton({ id, name, deleteAction, redirectTo }: DeleteButtonProps): ReactElement {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(): Promise<void> {
    setIsDeleting(true);
    setError(null);
    try {
      const result = await deleteAction(id);
      if (!result.ok) {
        setError(result.error);
        setIsDeleting(false);
        return;
      }
      router.push(redirectTo);
    } catch {
      setError("No se pudo eliminar.");
      setIsDeleting(false);
    }
  }

  if (showConfirm) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3d3530]/50 p-6">
        <div className="w-full max-w-sm rounded-2xl bg-[#faf8f5] p-6 shadow-xl">
          <h2 className="mb-2 text-lg font-medium text-[#3d3530]">¿Eliminar?</h2>
          <p className="mb-6 text-sm text-[#8b7355]">
            ¿Estás seguro de que quieres eliminar &quot;{name}&quot;?
          </p>
          <FormMessage message={error} />
          <div className="flex gap-3">
            <button onClick={() => { setShowConfirm(false); }} disabled={isDeleting}
              className="flex-1 rounded-xl border-2 border-[#e8e0d4] py-3 text-sm font-medium text-[#8b7355]">Cancelar</button>
            <button onClick={() => void handleDelete()} disabled={isDeleting}
              className="flex-1 rounded-xl bg-[#a68b5b] py-3 text-sm font-medium text-white disabled:opacity-50">
              {isDeleting ? "..." : "Eliminar"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => { setShowConfirm(true); }}
      aria-label={`Eliminar ${name}`}
      className="rounded-full bg-[#f5f0e8] p-2 text-[#8b7355]"
    >
      🗑
    </button>
  );
}
