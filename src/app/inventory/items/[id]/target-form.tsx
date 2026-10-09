"use client";

import { useRouter } from "next/navigation";
import { type ReactElement, useState } from "react";

import { FormMessage } from "@/components/form-feedback";
import { useActionForm } from "@/components/hooks/use-action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/i18n";
import { setInventoryTarget } from "@/lib/actions/inventory-targets";

export function TargetForm({ productId, unit, quantity, compact = false }: { productId: string; unit: string; quantity: string | null; compact?: boolean }): ReactElement {
  const router = useRouter();
  const [value, setValue] = useState(quantity ?? "");
  const [saved, setSaved] = useState(false);
  const { error, isSubmitting, runAction } = useActionForm();
  async function save(): Promise<void> {
    setSaved(false);
    const result = await runAction(() => setInventoryTarget({ productId, quantity: value }));
    if (result.ok) { setSaved(true); router.refresh(); }
  }
  return <form className={compact ? "space-y-1" : "space-y-3"} onSubmit={(event) => { event.preventDefault(); void save(); }}>
    <div className={compact ? "flex items-center gap-2" : "space-y-3"}>
    <label className={compact ? "flex min-w-0 flex-1 items-center gap-2 text-sm" : "block text-sm"}><span className={compact ? "sr-only" : undefined}>{t.inventoryTargets.quantity(unit)}</span><Input className={compact ? "min-w-0 flex-1" : undefined} placeholder={compact ? "Cantidad" : undefined} type="number" min="0" max="9999999999.99" step="0.01" inputMode="decimal" value={value} required disabled={isSubmitting} onChange={(event) => { setValue(event.target.value); setSaved(false); }} />{compact && <span className="shrink-0 text-muted">{unit}</span>}</label>
    <Button type="submit" disabled={isSubmitting}>{isSubmitting ? t.common.saving : compact ? "Guardar" : t.inventoryTargets.save}</Button>
    </div>
    <FormMessage message={error} />
    {saved && <p role="status" className="text-sm">{t.inventoryTargets.saved}</p>}
  </form>;
}
