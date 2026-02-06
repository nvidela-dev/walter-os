"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteProvider } from "../actions";

export function DeleteProviderButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    await deleteProvider(id);
    router.push("/providers");
  }

  if (showConfirm) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
          <h2 className="mb-2 text-xl font-bold text-gray-800">Delete Provider?</h2>
          <p className="mb-6 text-gray-600">Are you sure you want to delete &quot;{name}&quot;? This cannot be undone.</p>
          <div className="flex gap-3">
            <button onClick={() => setShowConfirm(false)} disabled={isDeleting}
              className="flex-1 rounded-xl border-2 border-gray-200 py-3 text-lg font-medium text-gray-700 active:bg-gray-50">Cancel</button>
            <button onClick={handleDelete} disabled={isDeleting}
              className="flex-1 rounded-xl bg-red-500 py-3 text-lg font-medium text-white active:bg-red-600 disabled:opacity-50">
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button onClick={() => setShowConfirm(true)} className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-xl text-red-600">🗑️</button>
  );
}
