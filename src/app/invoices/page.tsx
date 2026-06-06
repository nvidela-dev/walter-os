import { DocumentTextIcon, PlusIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { ReactElement } from "react";

import { EmptyState } from "@/components/list-page-shell";
import { buttonClassName } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { t } from "@/i18n";
import { getInvoices } from "@/lib/queries/invoices";

import { InvoiceList } from "./invoice-list";

export const dynamic = "force-dynamic";

export default async function InvoicesPage(): Promise<ReactElement> {
  const invoices = await getInvoices();

  return (
    <div className="ios-screen">
      <div className="ios-page flex flex-col">
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

      <main className="flex-1 py-5">
        {invoices.length === 0 ? (
          <EmptyState
            icon={DocumentTextIcon}
            title={t.invoices.emptyTitle}
            description={t.invoices.emptyDescription}
            ctaHref="/invoices/new"
            ctaText={t.invoices.newTitle}
          />
        ) : (
          <InvoiceList invoices={invoices} />
        )}
      </main>
      </div>
    </div>
  );
}
