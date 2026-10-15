"use client";
import { useRouter } from "next/navigation";
import type { ReactElement } from "react";

import { FormMessage } from "@/components/form-feedback";
import { useActionForm } from "@/components/hooks/use-action-form";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { createMenuDraft } from "@/lib/actions/menu-versions";
import { getFormString } from "@/lib/form";
export function NewMenuForm({families}: {families: string[]}): ReactElement {
  const router = useRouter();
  const {error,isSubmitting,runAction} = useActionForm();
  return <form className="space-y-4 rounded-2xl border p-4" onSubmit={event => {event.preventDefault(); const family = getFormString(new FormData(event.currentTarget), "family"); void runAction(() => createMenuDraft(family)).then(result => {if(result.ok) router.push(`/menu/versions/${result.data.id}`);});}}><label className="block text-sm">Carta<Select name="family">{families.map(family => <option key={family}>{family}</option>)}</Select></label><FormMessage message={error} /><Button disabled={isSubmitting} type="submit">{isSubmitting ? "Creando…" : "Crear borrador"}</Button></form>;
}
