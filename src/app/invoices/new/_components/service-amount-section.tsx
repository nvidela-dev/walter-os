import type { ReactElement } from "react";

import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { t } from "@/i18n";

export function ServiceAmountSection({
  amount,
  disabled,
  setAmount,
}: {
  amount: string;
  disabled: boolean;
  setAmount: (value: string) => void;
}): ReactElement {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-medium text-[#8b7355]">{t.invoices.fields.amount}</h2>
      </div>
      <div className="rounded-xl bg-white p-4">
        <FormField htmlFor="invoice-amount" label={t.invoices.fields.amountPrompt}>
          <Input
            id="invoice-amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            required
            disabled={disabled}
            value={amount}
            onChange={(event) => { setAmount(event.target.value); }}
          />
        </FormField>
      </div>
    </section>
  );
}
