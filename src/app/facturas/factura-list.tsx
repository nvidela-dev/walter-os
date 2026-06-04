"use client";

import { CheckIcon } from "@heroicons/react/24/solid";
import { type ReactElement, useMemo, useState, useTransition } from "react";

import { FormMessage } from "@/components/form-feedback";

import { togglePaid } from "./actions";

interface FacturaRow {
  id: string;
  proveedorId: string;
  proveedorNombre: string;
  fecha: string;
  numero: string | null;
  total: string;
  paid: boolean;
}

type Filter = "all" | "unpaid" | "paid";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "unpaid", label: "Pendientes" },
  { key: "paid", label: "Pagadas" },
];

type TogglePaidAction = typeof togglePaid;

export function FacturaList({
  facturas,
  togglePaidAction = togglePaid,
}: {
  facturas: FacturaRow[];
  togglePaidAction?: TogglePaidAction;
}): ReactElement {
  const [filter, setFilter] = useState<Filter>("all");

  const counts = useMemo(() => {
    const paid = facturas.filter((f) => f.paid).length;
    return { all: facturas.length, paid, unpaid: facturas.length - paid };
  }, [facturas]);

  const filtered = useMemo(() => {
    if (filter === "paid") return facturas.filter((f) => f.paid);
    if (filter === "unpaid") return facturas.filter((f) => !f.paid);
    return facturas;
  }, [facturas, filter]);

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
              className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-[#c4a77d] text-white"
                  : "bg-[#f5f0e8] text-[#8b7355] hover:bg-[#e8e0d4]"
              }`}
            >
              {f.label}
              <span className={`ml-2 text-xs ${active ? "text-white/80" : "text-[#c4a77d]"}`}>
                {counts[f.key]}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-[#8b7355]">
          {filter === "paid"
            ? "No hay facturas pagadas."
            : filter === "unpaid"
              ? "No hay facturas pendientes."
              : "Sin facturas."}
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((factura) => (
            <FacturaRow key={factura.id} factura={factura} togglePaidAction={togglePaidAction} />
          ))}
        </div>
      )}
    </div>
  );
}

function FacturaRow({
  factura,
  togglePaidAction,
}: {
  factura: FacturaRow;
  togglePaidAction: TogglePaidAction;
}): ReactElement {
  const [isPending, startTransition] = useTransition();
  const [optimisticPaid, setOptimisticPaid] = useState(factura.paid);
  const [error, setError] = useState<string | null>(null);

  function handleToggle(): void {
    if (isPending) return;
    const next = !optimisticPaid;
    setOptimisticPaid(next);
    setError(null);
    startTransition(async () => {
      try {
        const result = await togglePaidAction(factura.id);
        if (!result.ok) {
          setError(result.error);
          setOptimisticPaid(!next);
        }
      } catch {
        setError("No se pudo actualizar la factura.");
        setOptimisticPaid(!next);
      }
    });
  }

  return (
    <div className="space-y-2">
      <div
        className={`flex items-center gap-4 rounded-2xl p-4 transition-colors ${
          optimisticPaid ? "bg-[#f5f0e8]/60" : "bg-[#f5f0e8]"
        }`}
      >
        <button
          type="button"
          onClick={handleToggle}
          disabled={isPending}
          aria-label={optimisticPaid ? "Marcar como pendiente" : "Marcar como pagada"}
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
            optimisticPaid
              ? "border-emerald-600 bg-emerald-600 text-white"
              : "border-[#c4a77d] bg-white"
          } ${isPending ? "opacity-60" : ""}`}
        >
          {optimisticPaid && <CheckIcon className="h-4 w-4" />}
        </button>

        <div className="min-w-0 flex-1">
          <p
            className={`truncate font-medium ${
              optimisticPaid ? "text-[#8b7355]" : "text-[#3d3530]"
            }`}
          >
            {factura.proveedorNombre}
          </p>
          <p className="text-xs text-[#8b7355]">
            {factura.fecha}
            {factura.numero != null && factura.numero !== "" && <> · #{factura.numero}</>}
          </p>
        </div>

        <div
          className={`text-right text-sm font-medium ${
            optimisticPaid ? "text-[#8b7355]" : "text-[#3d3530]"
          }`}
        >
          ${factura.total}
        </div>
      </div>
      <FormMessage message={error} />
    </div>
  );
}
