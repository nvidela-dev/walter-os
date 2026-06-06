"use client";

import { TrashIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { type ReactElement, useState } from "react";

import { t } from "@/i18n";
import type { ActionResult } from "@/lib/action-result";

import { FormMessage } from "./form-feedback";
import { Button } from "./ui/button";

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
      setError(t.deleteDialog.failed);
      setIsDeleting(false);
    }
  }

  if (showConfirm) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1f2d35]/38 p-6 backdrop-blur-md">
        <div className="ios-panel-strong w-full max-w-sm p-6">
          <h2 className="mb-2 text-lg font-semibold text-[#1f2d35]">{t.deleteDialog.title}</h2>
          <p className="mb-6 text-sm text-[#526b74]">{t.deleteDialog.confirm(name)}</p>
          <FormMessage message={error} />
          <div className="flex gap-3">
            <Button onClick={() => { setShowConfirm(false); }} disabled={isDeleting}
              variant="secondary" className="flex-1 py-3 text-sm">{t.common.cancel}</Button>
            <Button onClick={() => void handleDelete()} disabled={isDeleting}
              variant="danger" className="flex-1 py-3 text-sm">
              {isDeleting ? t.common.loading : t.common.delete}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Button
      onClick={() => { setShowConfirm(true); }}
      aria-label={t.deleteDialog.trigger(name)}
      variant="ghost"
      size="icon"
      className="rounded-full"
    >
      <TrashIcon className="h-5 w-5" />
    </Button>
  );
}
