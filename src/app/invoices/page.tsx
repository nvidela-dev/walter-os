import { ArrowLeftIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { ReactElement } from "react";

import { t } from "@/i18n";

import { getInvoices } from "./actions";
import { InvoiceList } from "./invoice-list";

export const dynamic = "force-dynamic";

export default async function InvoicesPage(): Promise<ReactElement> {
  const invoices = await getInvoices();

  return (
    <div className="flex min-h-screen flex-col bg-[#faf8f5]">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-[#faf8f5]/90 px-6 py-5 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f0e8] text-[#8b7355]"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-light text-[#3d3530]">{t.invoices.title}</h1>
        </div>
        <Link
          href="/invoices/new"
          className="rounded-full bg-[#c4a77d] px-5 py-3 text-sm font-medium text-white shadow-sm active:scale-[0.98]"
        >
          + {t.invoices.addShort}
        </Link>
      </header>

      <main className="flex-1 px-6 py-4">
        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <DocumentTextIcon className="mb-4 h-16 w-16 text-[#c4a77d]" />
            <h2 className="mb-2 text-lg font-medium text-[#3d3530]">{t.invoices.emptyTitle}</h2>
            <p className="mb-6 text-sm text-[#8b7355]">{t.invoices.emptyDescription}</p>
            <Link
              href="/invoices/new"
              className="rounded-full bg-[#c4a77d] px-6 py-3 text-sm font-medium text-white shadow-sm"
            >
              {t.invoices.newTitle}
            </Link>
          </div>
        ) : (
          <InvoiceList invoices={invoices} />
        )}
      </main>
    </div>
  );
}
