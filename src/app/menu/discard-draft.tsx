"use client";

import { useRouter } from "next/navigation";
import { type ReactElement, useState } from "react";

import { FormMessage } from "@/components/form-feedback";
import { useActionForm } from "@/components/hooks/use-action-form";
import { Button } from "@/components/ui/button";
import { discardMenuDraft } from "@/lib/actions/menu-versions";

export function DiscardDraft({ id, revision, disabled = false }: { id: string; revision: number; disabled?: boolean }): ReactElement {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const { error, isSubmitting, runAction } = useActionForm();
  async function discard(): Promise<void> {
    const result = await runAction(() => discardMenuDraft(id, revision));
    if (result.ok) { router.push("/menu"); router.refresh(); }
  }
  if (!confirming) return <Button variant="ghost" disabled={disabled} onClick={() => { setConfirming(true); }}>Descartar borrador</Button>;
  return <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-3">
    <p className="text-sm font-semibold">¿Descartar este borrador?</p>
    <p className="text-sm">Se eliminará esta copia y sus cambios sin guardar. El menú activo y el historial se conservan. No se puede deshacer.</p>
    <FormMessage message={error} />
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" disabled={isSubmitting} onClick={() => { setConfirming(false); }}>Conservar borrador</Button>
      <Button variant="danger" busy={isSubmitting} disabled={disabled} onClick={() => { void discard(); }}>{isSubmitting ? "Descartando…" : "Sí, descartar borrador"}</Button>
    </div>
  </div>;
}
