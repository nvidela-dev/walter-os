"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface DeleteButtonProps {
  id: string;
  name: string;
  deleteAction: (id: string) => Promise<void>;
  redirectTo: string;
}

export function DeleteButton({ id, name, deleteAction, redirectTo }: DeleteButtonProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    await deleteAction(id);
    router.push(redirectTo);
  }

  if (showConfirm) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3d3530]/50 p-6">
        <div className="w-full max-w-sm rounded-2xl bg-[#faf8f5] p-6 shadow-xl">
          <h2 className="mb-2 text-lg font-medium text-[#3d3530]">¿Eliminar?</h2>
          <p className="mb-6 text-sm text-[#8b7355]">
            ¿Estás seguro de que quieres eliminar &quot;{name}&quot;?
          </p>
          <div className="flex gap-3">
            <button onClick={() => setShowConfirm(false)} disabled={isDeleting}
              className="flex-1 rounded-xl border-2 border-[#e8e0d4] py-3 text-sm font-medium text-[#8b7355]">Cancelar</button>
            <button onClick={handleDelete} disabled={isDeleting}
              className="flex-1 rounded-xl bg-[#a68b5b] py-3 text-sm font-medium text-white disabled:opacity-50">
              {isDeleting ? "..." : "Eliminar"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <button onClick={() => setShowConfirm(true)} className="rounded-full bg-[#f5f0e8] p-2 text-[#8b7355]">🗑</button>;
}
