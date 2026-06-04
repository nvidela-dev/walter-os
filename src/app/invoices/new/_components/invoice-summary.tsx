import type { ReactElement } from "react";

import { FormMessage } from "@/components/form-feedback";
import { Button } from "@/components/ui/button";
import { t } from "@/i18n";

export function InvoiceSummary({
  error,
  isPending,
  total,
}: {
  error: string | null;
  isPending: boolean;
  total: number;
}): ReactElement {
  return (
    <section className="rounded-2xl bg-[#f5f0e8] p-6">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-[#8b7355]">{t.invoices.fields.total}</span>
        <span className="text-2xl font-light text-[#3d3530]">${total.toFixed(2)}</span>
      </div>

      <FormMessage message={error} className="mb-3" />

      <Button type="submit" disabled={isPending} className="w-full py-4 text-base">
        {isPending ? t.common.saving : t.invoices.create}
      </Button>
    </section>
  );
}
