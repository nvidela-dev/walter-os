"use client";

import { TrashIcon } from "@heroicons/react/24/outline";
import { CheckIcon } from "@heroicons/react/24/solid";
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
  const [filter, setFilter] = useState<Filter>("all");
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
              className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-[#c4a77d] text-white"
                  : "bg-[#f5f0e8] text-[#8b7355] hover:bg-[#e8e0d4]"
              }`}
            >
              {f.label}
              <span className={`ml-1.5 text-xs ${active ? "text-white/80" : "text-[#c4a77d]"}`}>
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

  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const showOverdue = invoice.overdue && !optimisticPaid;

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
        className={`flex items-center gap-3 rounded-2xl p-4 transition-colors ${
          optimisticPaid ? "bg-[#f5f0e8]/60" : "bg-[#f5f0e8]"
        }`}
      >
        <button
          type="button"
          onClick={handleToggle}
          disabled={isPending}
          aria-label={optimisticPaid ? t.invoices.list.markUnpaid : t.invoices.list.markPaid}
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
            optimisticPaid
              ? "border-emerald-600 bg-emerald-600 text-white"
              : showOverdue
                ? "border-rose-400 bg-white"
                : "border-[#c4a77d] bg-white"
          } ${isPending ? "opacity-60" : ""}`}
        >
          {optimisticPaid && <CheckIcon className="h-4 w-4" />}
        </button>

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
          className={`text-right text-sm font-medium ${
            optimisticPaid ? "text-[#8b7355]" : "text-[#3d3530]"
          }`}
        >
          ${invoice.total}
        </div>

        <Button
          onClick={() => { setShowConfirm(true); }}
          aria-label={t.invoices.list.delete}
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 rounded-full bg-transparent text-[#a68b5b] hover:bg-[#e8e0d4]"
        >
          <TrashIcon className="h-5 w-5" />
        </Button>
      </div>

      <FormMessage message={error} />

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3d3530]/50 p-6">
          <div className="w-full max-w-sm rounded-2xl bg-[#faf8f5] p-6 shadow-xl">
            <h2 className="mb-2 text-lg font-medium text-[#3d3530]">{t.deleteDialog.title}</h2>
            <p className="mb-6 text-sm text-[#8b7355]">
              {t.deleteDialog.confirm(invoice.providerName)}
            </p>
            <FormMessage message={deleteError} />
            <div className="flex gap-3">
              <Button
                onClick={() => { setShowConfirm(false); setDeleteError(null); }}
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
