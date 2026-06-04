"use client";

import { type ReactElement, useState } from "react";

import { FormMessage } from "@/components/form-feedback";
import { useActionForm } from "@/components/hooks/use-action-form";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { t } from "@/i18n";
import { updateProviderDebt } from "@/lib/actions/providers";
import { getFormString } from "@/lib/form";

export function DebtForm({
  providerId,
  currentDebt,
}: {
  providerId: string;
  currentDebt: string;
}): ReactElement {
  const [saved, setSaved] = useState(false);
  const { error, isSubmitting, runAction } = useActionForm();

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setSaved(false);

    const formData = new FormData(e.currentTarget);
    const debt = getFormString(formData, "debt") || "0";

    const result = await runAction(() => updateProviderDebt(providerId, { debt }));
    if (!result.ok) return;
    setSaved(true);

    setTimeout(() => { setSaved(false); }, 2000);
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
      <FormMessage message={error} />
      <div className="flex items-end gap-3">
        <FormField className="flex-1" htmlFor="provider-debt" label={t.providers.fields.currentDebt}>
          <Input
            type="number"
            id="provider-debt"
            name="debt"
            step="0.01"
            defaultValue={currentDebt}
          />
        </FormField>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 text-sm"
        >
          {isSubmitting ? t.common.loading : saved ? t.common.saved : t.common.save}
        </Button>
      </div>
    </form>
  );
}
