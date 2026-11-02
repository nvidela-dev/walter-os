"use client";
import { useRouter } from "next/navigation";
import { type ReactElement, useState } from "react";

import { FormMessage } from "@/components/form-feedback";
import { useActionForm } from "@/components/hooks/use-action-form";
import { Button } from "@/components/ui/button";
import { deleteSavedInventory } from "@/lib/actions/delete-inventory";

export function DeleteInventory({ kind, id, token, label }: { kind: "food" | "drinks"; id: string; token: string; label: string }): ReactElement {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const { error, isSubmitting, runAction } = useActionForm();
  if (!confirm) return <Button variant="ghost" onClick={() => { setConfirm(true); }}>Eliminar inventario</Button>;
  return <section className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-3">
    <h2 className="font-semibold">¿Eliminar {label}?</h2>
    <p className="text-sm">Se eliminará todo este inventario y sus conteos. No se puede deshacer. Los productos, objetivos y proveedores se conservan.</p>
    <FormMessage message={error} /><div className="flex flex-wrap gap-2">
      <Button variant="secondary" disabled={isSubmitting} onClick={() => { setConfirm(false); }}>Conservar inventario</Button>
      <Button variant="danger" busy={isSubmitting} onClick={() => { void runAction(() => deleteSavedInventory(kind, id, token)).then(result => { if (result.ok) { router.push(kind === "food" ? "/inventory/history" : "/drinks"); router.refresh(); } }); }}>{isSubmitting ? "Eliminando…" : "Sí, eliminar inventario"}</Button>
    </div>
  </section>;
}
