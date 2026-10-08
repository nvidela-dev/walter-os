"use client";

import type { ReactElement, SyntheticEvent } from "react";

import { FormMessage } from "@/components/form-feedback";
import { useActionForm } from "@/components/hooks/use-action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/i18n";
import { createFridge } from "@/lib/actions/inventory";
import { getFormString } from "@/lib/form";

export function FridgeForm(): ReactElement {
  const { error, isSubmitting, runAction } = useActionForm();
  async function submit(event: SyntheticEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const result = await runAction(() => createFridge({ number: getFormString(data, "number"), name: getFormString(data, "name") }));
    if (result.ok) form.reset();
  }
  return <details className="app-card rounded-2xl p-5"><summary className="cursor-pointer font-medium">{t.inventory.createFridge}</summary>
    <form onSubmit={(event) => void submit(event)} className="mt-4 space-y-3">
      <FormMessage message={error} />
      <label className="block">{t.inventory.number}<Input name="number" type="number" inputMode="numeric" min="1" step="1" required /></label>
      <label className="block">{t.inventory.name}<Input name="name" maxLength={200} /></label>
      <Button type="submit" disabled={isSubmitting}>{t.inventory.createFridge}</Button>
    </form>
  </details>;
}
