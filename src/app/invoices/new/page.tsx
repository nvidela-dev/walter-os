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
    <div className="flex min-h-screen flex-col bg-[#faf8f5]">
      <PageHeader backHref="/" title={t.invoices.newTitle} />

      <main className="flex-1 px-6 py-4 pb-24">
        {providers.length === 0 ? (
          <div className="rounded-2xl bg-[#f5f0e8] p-6 text-center">
            <p className="mb-2 text-[#3d3530]">{t.invoices.noProvidersTitle}</p>
            <p className="text-sm text-[#8b7355]">{t.invoices.noProvidersHint}</p>
            <Link
              href="/providers"
              className="mt-4 inline-block rounded-full bg-[#c4a77d] px-5 py-3 text-sm font-medium text-white"
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
