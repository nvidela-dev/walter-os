import { PlusIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { ReactElement } from "react";

import { buttonClassName } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
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
    <div className="ios-screen overflow-x-hidden">
      <div className="ios-page flex min-w-0 flex-col">
        <PageHeader
          backHref="/"
          title={t.invoices.title}
          actions={
            <Link
              href="/invoices/new"
              className={buttonClassName({ className: "rounded-full px-4 text-sm" })}
            >
              <PlusIcon className="h-4 w-4" />
              {t.invoices.addShort}
            </Link>
          }
        />

        <main className="min-w-0 flex-1 py-5">
          {/* Always render the tabbed list because empty states are per tab. */}
          <InvoiceList invoices={invoices} />
        </main>
      </div>
    </div>
  );
}
