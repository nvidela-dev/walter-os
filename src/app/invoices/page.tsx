import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { ReactElement } from "react";

import { t } from "@/i18n";
import { isInvoiceOverdue } from "@/lib/invoices/overdue";
import { getInvoices } from "@/lib/queries/invoices";

import { InvoiceList } from "./invoice-list";

export const dynamic = "force-dynamic";

export default async function InvoicesPage(): Promise<ReactElement> {
  const now = new Date();
  const invoices = (await getInvoices()).map((invoice) => ({
    ...invoice,
    overdue: isInvoiceOverdue(invoice.date, invoice.paid, now),
  }));

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
        {/* Always render the tabbed list — the empty states (and their
            create prompt) are handled per-tab inside InvoiceList. */}
        <InvoiceList invoices={invoices} />
      </main>
    </div>
  );
}
