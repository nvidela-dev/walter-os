"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import { type ReactElement, type SyntheticEvent, useId, useRef } from "react";

import { FormMessage } from "@/components/form-feedback";
import { useActionForm } from "@/components/hooks/use-action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/i18n";
import { createFridge } from "@/lib/actions/inventory";
import { getFormString } from "@/lib/form";

export function FridgeForm(): ReactElement {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const { error, isSubmitting, runAction } = useActionForm();
  async function submit(event: SyntheticEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const result = await runAction(() => createFridge({ number: getFormString(data, "number"), name: getFormString(data, "name") }));
    if (result.ok) { form.reset(); dialog.current?.close(); }
  }
  return <>
    <button type="button" className="app-card flex min-h-16 w-12 shrink-0 items-center justify-center rounded-2xl" aria-label={t.inventory.createFridge} title={t.inventory.createFridge} onClick={() => { dialog.current?.showModal(); }}><PlusIcon className="h-6 w-6" aria-hidden="true" /></button>
    <dialog ref={dialog} aria-labelledby={titleId} className="app-panel m-auto w-[calc(100%_-_2rem)] max-w-sm p-5 backdrop:bg-black/40">
      <h2 id={titleId} className="text-lg font-semibold tracking-tight">{t.inventory.createFridge}</h2>
      <form onSubmit={(event) => void submit(event)} className="mt-4 space-y-3">
        <FormMessage message={error} />
        <label className="block">{t.inventory.number}<Input name="number" type="number" inputMode="numeric" min="1" step="1" required /></label>
        <label className="block">{t.inventory.name}<Input name="name" maxLength={200} /></label>
        <div className="flex gap-2"><Button type="submit" disabled={isSubmitting}>{t.inventory.createFridge}</Button><Button variant="secondary" disabled={isSubmitting} onClick={() => { dialog.current?.close(); }}>{t.common.cancel}</Button></div>
      </form>
    </dialog>
  </>;
}
