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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3d3530]/50 p-6">
        <div className="w-full max-w-sm rounded-2xl bg-[#faf8f5] p-6 shadow-xl">
          <h2 className="mb-2 text-lg font-medium text-[#3d3530]">Delete Provider?</h2>
          <p className="mb-6 text-sm text-[#8b7355]">
            Are you sure you want to delete &quot;{name}&quot; and all its products?
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirm(false)}
              disabled={isDeleting}
              className="flex-1 rounded-xl border-2 border-[#e8e0d4] py-3 text-sm font-medium text-[#8b7355]"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 rounded-xl bg-[#a68b5b] py-3 text-sm font-medium text-white disabled:opacity-50"
            >
              {isDeleting ? "..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="rounded-full bg-[#f5f0e8] p-2 text-[#8b7355]"
    >
      🗑
    </button>
  );
}
