"use client";

import { CheckIcon } from "@heroicons/react/24/solid";
import { type ReactElement, useMemo, useState, useTransition } from "react";

import { FormMessage } from "@/components/form-feedback";
import { t } from "@/i18n";
import { togglePaid } from "@/lib/actions/invoices";

interface InvoiceRow {
  id: string;
  providerId: string;
  providerName: string;
  date: string;
  number: string | null;
  total: string;
  paid: boolean;
}

type Filter = "all" | "unpaid" | "paid";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: t.invoices.list.filters.all },
  { key: "unpaid", label: t.invoices.list.filters.unpaid },
  { key: "paid", label: t.invoices.list.filters.paid },
];

type TogglePaidAction = typeof togglePaid;

export function InvoiceList({
  invoices,
  togglePaidAction = togglePaid,
}: {
  invoices: InvoiceRow[];
  togglePaidAction?: TogglePaidAction;
}): ReactElement {
  const [filter, setFilter] = useState<Filter>("all");

  const counts = useMemo(() => {
    const paid = invoices.filter((f) => f.paid).length;
    return { all: invoices.length, paid, unpaid: invoices.length - paid };
  }, [invoices]);

  const filtered = useMemo(() => {
    if (filter === "paid") return invoices.filter((f) => f.paid);
    if (filter === "unpaid") return invoices.filter((f) => !f.paid);
    return invoices;
  }, [invoices, filter]);

  return (
    <div className="space-y-4">
      <div className="ios-glass flex gap-1 rounded-full p-1">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => { setFilter(f.key); }}
              className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
                active
                  ? "bg-white text-[#1f2d35] shadow-sm"
                  : "text-[#526b74] hover:bg-white/40"
              }`}
            >
              {f.label}
              <span className={`ml-2 text-xs ${active ? "text-[#2388d1]" : "text-[#799099]"}`}>
                {counts[f.key]}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="ios-panel py-12 text-center text-sm text-[#526b74]">
          {filter === "paid"
            ? t.invoices.list.emptyPaid
            : filter === "unpaid"
              ? t.invoices.list.emptyUnpaid
              : t.invoices.list.empty}
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((invoice) => (
            <InvoiceRow key={invoice.id} invoice={invoice} togglePaidAction={togglePaidAction} />
          ))}
        </div>
      )}
    </div>
  );
}

function InvoiceRow({
  invoice,
  togglePaidAction,
}: {
  invoice: InvoiceRow;
  togglePaidAction: TogglePaidAction;
}): ReactElement {
  const [isPending, startTransition] = useTransition();
  const [optimisticPaid, setOptimisticPaid] = useState(invoice.paid);
  const [error, setError] = useState<string | null>(null);

  function handleToggle(): void {
    if (isPending) return;
    const next = !optimisticPaid;
    setOptimisticPaid(next);
    setError(null);
    startTransition(async () => {
      try {
        const result = await togglePaidAction(invoice.id);
        if (!result.ok) {
          setError(result.error);
          setOptimisticPaid(!next);
        }
      } catch {
        setError(t.invoices.list.toggleFailed);
        setOptimisticPaid(!next);
      }
    });
  }

  return (
    <div className="space-y-2">
      <div
        className={`ios-list-row flex items-center gap-4 rounded-[1.4rem] p-4 transition ${
          optimisticPaid ? "opacity-75" : ""
        }`}
      >
        <button
          type="button"
          onClick={handleToggle}
          disabled={isPending}
          aria-label={optimisticPaid ? t.invoices.list.markUnpaid : t.invoices.list.markPaid}
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
            optimisticPaid
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-[#2388d1] bg-white/70"
          } ${isPending ? "opacity-60" : ""}`}
        >
          {optimisticPaid && <CheckIcon className="h-4 w-4" />}
        </button>

        <div className="min-w-0 flex-1">
          <p
            className={`truncate font-medium ${
              optimisticPaid ? "text-[#526b74]" : "text-[#1f2d35]"
            }`}
          >
            {invoice.providerName}
          </p>
          <p className="text-xs text-[#526b74]">
            {invoice.date}
            {invoice.number != null && invoice.number !== "" && <> · #{invoice.number}</>}
          </p>
        </div>

        <div
          className={`text-right text-sm font-medium ${
            optimisticPaid ? "text-[#8b7355]" : "text-[#3d3530]"
          }`}
        >
          ${invoice.total}
        </div>
      </div>
      <FormMessage message={error} />
    </div>
  );
}
