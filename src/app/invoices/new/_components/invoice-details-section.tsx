import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { t } from "@/i18n";
import type { InvoiceFormProvider } from "@/lib/types/invoices";
import type { ProviderType } from "@/lib/types/providers";

const TYPE_TABS: { value: ProviderType; label: string }[] = [
  { value: "producto", label: t.providers.types.producto },
  { value: "servicio", label: t.providers.types.servicio },
];

export function InvoiceDetailsSection({
  changeProvider,
  changeType,
  date,
  notes,
  number,
  providerId,
  setDate,
  setNotes,
  setNumber,
  type,
  visibleProviders,
}: {
  changeProvider: (id: string) => void;
  changeType: (type: ProviderType) => void;
  date: string;
  notes: string;
  number: string;
  providerId: string;
  setDate: (value: string) => void;
  setNotes: (value: string) => void;
  setNumber: (value: string) => void;
  type: ProviderType;
  visibleProviders: InvoiceFormProvider[];
}): ReactElement {
  return (
    <section className="space-y-4 rounded-2xl bg-[#f5f0e8] p-6">
      <div>
        <p className="mb-2 text-xs font-medium text-[#8b7355]">{t.invoices.fields.type}</p>
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white p-1">
          {TYPE_TABS.map((tab) => (
            <Button
              key={tab.value}
              type="button"
              onClick={() => { changeType(tab.value); }}
              variant={tab.value === type ? "primary" : "ghost"}
              className="py-2.5 text-sm"
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      <FormField htmlFor="invoice-provider" label={t.invoices.fields.provider}>
        <Select
          id="invoice-provider"
          required
          value={providerId}
          onChange={(event) => { changeProvider(event.target.value); }}
        >
          <option value="">
            {visibleProviders.length === 0
              ? type === "servicio"
                ? t.invoices.fields.noProvidersOfService
                : t.invoices.fields.noProvidersOfProduct
              : t.invoices.fields.providerPlaceholder}
          </option>
          {visibleProviders.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.name}
            </option>
          ))}
        </Select>
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField htmlFor="invoice-date" label={t.invoices.fields.date}>
          <Input
            type="date"
            id="invoice-date"
            required
            value={date}
            onChange={(event) => { setDate(event.target.value); }}
          />
        </FormField>
        <FormField htmlFor="invoice-number" label={t.invoices.fields.number}>
          <Input
            type="text"
            id="invoice-number"
            value={number}
            onChange={(event) => { setNumber(event.target.value); }}
            placeholder={t.invoices.fields.numberPlaceholder}
          />
        </FormField>
      </div>

      <FormField htmlFor="invoice-notes" label={t.invoices.fields.notes}>
        <Textarea
          id="invoice-notes"
          rows={2}
          value={notes}
          onChange={(event) => { setNotes(event.target.value); }}
        />
      </FormField>
    </section>
  );
}
