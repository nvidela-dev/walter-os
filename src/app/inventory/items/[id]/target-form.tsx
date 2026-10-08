"use client";

import { useRouter } from "next/navigation";
import { type ReactElement, useState } from "react";

import { FormMessage } from "@/components/form-feedback";
import { useActionForm } from "@/components/hooks/use-action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/i18n";
import { setInventoryTarget } from "@/lib/actions/inventory-targets";

export function TargetForm({ productId, unit, quantity }: { productId: string; unit: string; quantity: string | null }): ReactElement {
  const router = useRouter();
  const [value, setValue] = useState(quantity ?? "");
  const [saved, setSaved] = useState(false);
  const { error, isSubmitting, runAction } = useActionForm();
  async function save(): Promise<void> {
    setSaved(false);
    const result = await runAction(() => setInventoryTarget({ productId, quantity: value }));
    if (result.ok) { setSaved(true); router.refresh(); }
  }
  return <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); void save(); }}>
    <label className="block text-sm">{t.inventoryTargets.quantity(unit)}<Input type="number" min="0" max="9999999999.99" step="0.01" inputMode="decimal" value={value} required disabled={isSubmitting} onChange={(event) => { setValue(event.target.value); setSaved(false); }} /></label>
    <Button type="submit" disabled={isSubmitting}>{isSubmitting ? t.common.saving : t.inventoryTargets.save}</Button>
    <FormMessage message={error} />
    {saved && <p role="status" className="text-sm">{t.inventoryTargets.saved}</p>}
  </form>;
}
