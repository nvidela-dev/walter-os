import Link from "next/link";
import type { ReactElement } from "react";

import { PageHeader } from "@/components/ui/page-header";
import { t } from "@/i18n";
import { getInvoiceFormData } from "@/lib/queries/invoices";
import { getUnits } from "@/lib/queries/units";

import { InvoiceForm } from "./invoice-form";

export const dynamic = "force-dynamic";

export default async function NewInvoicePage(): Promise<ReactElement> {
  const [providers, units] = await Promise.all([
    getInvoiceFormData(),
    getUnits(),
  ]);

  return (
    <div className="app-page flex flex-col bg-white">
      <PageHeader backHref="/" title={t.invoices.newTitle} />

      <main className="flex-1 py-5 pb-24">
        {providers.length === 0 ? (
          <div className="app-card rounded-2xl p-6 text-center">
            <p className="mb-2 text-[#0f172a]">{t.invoices.noProvidersTitle}</p>
            <p className="text-sm text-[#475569]">{t.invoices.noProvidersHint}</p>
            <Link
              href="/providers"
              className="mt-4 inline-block rounded-full bg-[#3f3f46] px-5 py-3 text-sm font-medium text-white"
            >
              {t.invoices.goToProviders}
            </Link>
          </div>
        ) : (
          <InvoiceForm providers={providers} units={units} />
        )}
      </main>
    </div>
  );
}
