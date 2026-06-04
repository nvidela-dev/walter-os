import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { ReactElement } from "react";

import { getUnits } from "@/app/providers/actions";
import { t } from "@/i18n";

import { getInvoiceFormData } from "../actions";
import { InvoiceForm } from "./invoice-form";

export const dynamic = "force-dynamic";

export default async function NewInvoicePage(): Promise<ReactElement> {
  const [providers, units] = await Promise.all([
    getInvoiceFormData(),
    getUnits(),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-[#faf8f5]">
      <header className="sticky top-0 z-10 flex items-center gap-4 bg-[#faf8f5]/90 px-6 py-5 backdrop-blur-sm">
        <Link
          href="/"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f0e8] text-[#8b7355]"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-light text-[#3d3530]">{t.invoices.newTitle}</h1>
      </header>

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
