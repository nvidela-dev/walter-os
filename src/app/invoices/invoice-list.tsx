"use client";

import { TrashIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { type ReactElement, useMemo, useState, useTransition } from "react";

import { FormMessage } from "@/components/form-feedback";
import { Button } from "@/components/ui/button";
import { t } from "@/i18n";
import { deleteInvoice, togglePaid } from "@/lib/actions/invoices";

interface InvoiceRow {
  id: string;
  providerId: string;
  providerName: string;
  date: string;
  number: string | null;
  total: string;
  paid: boolean;
  overdue: boolean;
}

type Filter = "all" | "unpaid" | "overdue" | "paid";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: t.invoices.list.filters.all },
  { key: "unpaid", label: t.invoices.list.filters.unpaid },
  { key: "overdue", label: t.invoices.list.filters.overdue },
  { key: "paid", label: t.invoices.list.filters.paid },
];

const EMPTY_MESSAGE: Record<Filter, string> = {
  all: t.invoices.list.empty,
  unpaid: t.invoices.list.emptyUnpaid,
  overdue: t.invoices.list.emptyOverdue,
  paid: t.invoices.list.emptyPaid,
};

// The Paid tab gets a green tint to set it apart from the (default) Unpaid view.
function tabClassName(key: Filter, active: boolean): string {
  if (key === "paid") {
    return active
      ? "bg-emerald-600 text-white"
      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100";
  }
  return active
    ? "bg-[#c4a77d] text-white"
    : "bg-[#f5f0e8] text-[#8b7355] hover:bg-[#e8e0d4]";
}

type TogglePaidAction = typeof togglePaid;
type DeleteInvoiceAction = typeof deleteInvoice;

export function InvoiceList({
  invoices,
  togglePaidAction = togglePaid,
  deleteInvoiceAction = deleteInvoice,
}: {
  invoices: InvoiceRow[];
  togglePaidAction?: TogglePaidAction;
  deleteInvoiceAction?: DeleteInvoiceAction;
}): ReactElement {
  // Default to Unpaid: the actionable bills the user opens this screen for.
  const [filter, setFilter] = useState<Filter>("unpaid");
  const [removedIds, setRemovedIds] = useState<ReadonlySet<string>>(new Set());

  const visible = useMemo(
    () => invoices.filter((f) => !removedIds.has(f.id)),
    [invoices, removedIds]
  );

  const counts = useMemo(() => {
    const paid = visible.filter((f) => f.paid).length;
    const overdue = visible.filter((f) => f.overdue && !f.paid).length;
    return { all: visible.length, paid, unpaid: visible.length - paid, overdue };
  }, [visible]);

  const filtered = useMemo(() => {
    if (filter === "paid") return visible.filter((f) => f.paid);
    if (filter === "unpaid") return visible.filter((f) => !f.paid);
    if (filter === "overdue") return visible.filter((f) => f.overdue && !f.paid);
    return visible;
  }, [visible, filter]);

  function handleDeleted(id: string): void {
    setRemovedIds((prev) => new Set(prev).add(id));
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => { setFilter(f.key); }}
              className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition-colors ${tabClassName(f.key, active)}`}
            >
              {f.label}
              <span className={`ml-1.5 text-xs ${active ? "text-white/80" : "opacity-70"}`}>
                {counts[f.key]}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-[#8b7355]">{EMPTY_MESSAGE[filter]}</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((invoice) => (
            <InvoiceRowItem
              key={invoice.id}
              invoice={invoice}
              togglePaidAction={togglePaidAction}
              deleteInvoiceAction={deleteInvoiceAction}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function InvoiceRowItem({
  invoice,
  togglePaidAction,
  deleteInvoiceAction,
  onDeleted,
}: {
  invoice: InvoiceRow;
  togglePaidAction: TogglePaidAction;
  deleteInvoiceAction: DeleteInvoiceAction;
  onDeleted: (id: string) => void;
}): ReactElement {
  const [isPending, startTransition] = useTransition();
  const [optimisticPaid, setOptimisticPaid] = useState(invoice.paid);
  const [error, setError] = useState<string | null>(null);

  const [showPayConfirm, setShowPayConfirm] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const showOverdue = invoice.overdue && !optimisticPaid;

  function applyPaid(next: boolean): void {
    if (isPending) return;
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

  function confirmPay(): void {
    setShowPayConfirm(false);
    applyPaid(true);
  }

  async function handleDelete(): Promise<void> {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const result = await deleteInvoiceAction(invoice.id);
      if (!result.ok) {
        setDeleteError(result.error);
        setIsDeleting(false);
        return;
      }
      onDeleted(invoice.id);
    } catch {
      setDeleteError(t.invoices.list.deleteFailed);
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-2">
      <div
        className={`rounded-2xl p-4 transition-colors ${
          optimisticPaid ? "bg-emerald-50/50" : "bg-[#f5f0e8]"
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p
                className={`truncate font-medium ${
                  optimisticPaid ? "text-[#8b7355]" : "text-[#3d3530]"
                }`}
              >
                {invoice.providerName}
              </p>
              {showOverdue && (
                <span className="shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-700">
                  {t.invoices.list.overdueBadge}
                </span>
              )}
            </div>
            <p className="text-xs text-[#8b7355]">
              {invoice.date}
              {invoice.number != null && invoice.number !== "" && <> · #{invoice.number}</>}
            </p>
          </div>

          <div
            className={`shrink-0 text-right text-sm font-medium ${
              optimisticPaid ? "text-[#8b7355]" : "text-[#3d3530]"
            }`}
          >
            ${invoice.total}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          {optimisticPaid ? (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-700">
                <CheckCircleIcon className="h-4 w-4" />
                {t.invoices.list.paidLabel}
              </span>
              <button
                type="button"
                onClick={() => { applyPaid(false); }}
                disabled={isPending}
                className="text-xs font-medium text-[#8b7355] underline-offset-2 hover:underline disabled:opacity-50"
              >
                {t.invoices.list.markUnpaid}
              </button>
            </>
          ) : (
            <Button
              onClick={() => { setShowPayConfirm(true); }}
              disabled={isPending}
              className="bg-emerald-600 px-5 py-2 text-sm"
            >
              {t.invoices.list.pay}
            </Button>
          )}

          <Button
            onClick={() => { setShowDeleteConfirm(true); }}
            aria-label={t.invoices.list.delete}
            variant="ghost"
            size="icon"
            className="ml-auto h-9 w-9 shrink-0 rounded-full bg-transparent text-[#a68b5b] hover:bg-[#e8e0d4]"
          >
            <TrashIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <FormMessage message={error} />

      {showPayConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3d3530]/50 p-6">
          <div className="w-full max-w-sm rounded-2xl bg-[#faf8f5] p-6 shadow-xl">
            <h2 className="mb-1 text-lg font-medium text-[#3d3530]">
              {t.invoices.list.payConfirmTitle}
            </h2>
            <p className="mb-4 text-sm text-[#8b7355]">{t.invoices.list.payConfirmHint}</p>

            <dl className="mb-6 space-y-2 rounded-xl bg-[#f5f0e8] p-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-[#8b7355]">{t.invoices.fields.provider}</dt>
                <dd className="truncate font-medium text-[#3d3530]">{invoice.providerName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#8b7355]">{t.invoices.fields.date}</dt>
                <dd className="font-medium text-[#3d3530]">{invoice.date}</dd>
              </div>
              {invoice.number != null && invoice.number !== "" && (
                <div className="flex justify-between gap-4">
                  <dt className="text-[#8b7355]">{t.invoices.fields.number}</dt>
                  <dd className="font-medium text-[#3d3530]">#{invoice.number}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4 border-t border-[#e8e0d4] pt-2">
                <dt className="text-[#8b7355]">{t.invoices.fields.total}</dt>
                <dd className="font-semibold text-[#3d3530]">${invoice.total}</dd>
              </div>
            </dl>

            <div className="flex gap-3">
              <Button
                onClick={() => { setShowPayConfirm(false); }}
                variant="secondary"
                className="flex-1 py-3 text-sm"
              >
                {t.common.cancel}
              </Button>
              <Button
                onClick={confirmPay}
                className="flex-1 bg-emerald-600 py-3 text-sm"
              >
                {t.invoices.list.payConfirmAction}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3d3530]/50 p-6">
          <div className="w-full max-w-sm rounded-2xl bg-[#faf8f5] p-6 shadow-xl">
            <h2 className="mb-2 text-lg font-medium text-[#3d3530]">{t.deleteDialog.title}</h2>
            <p className="mb-6 text-sm text-[#8b7355]">
              {t.deleteDialog.confirm(invoice.providerName)}
            </p>
            <FormMessage message={deleteError} />
            <div className="flex gap-3">
              <Button
                onClick={() => { setShowDeleteConfirm(false); setDeleteError(null); }}
                disabled={isDeleting}
                variant="secondary"
                className="flex-1 py-3 text-sm"
              >
                {t.common.cancel}
              </Button>
              <Button
                onClick={() => void handleDelete()}
                disabled={isDeleting}
                variant="danger"
                className="flex-1 py-3 text-sm"
              >
                {isDeleting ? t.common.loading : t.common.delete}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
