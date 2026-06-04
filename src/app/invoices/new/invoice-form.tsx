"use client";

import { PencilSquareIcon, PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { type ReactElement, useMemo, useState, useTransition } from "react";

import { createProductForProvider, updateProduct } from "@/app/providers/actions";
import { FormMessage } from "@/components/form-feedback";
import type { ProviderType } from "@/db/schema";
import { t } from "@/i18n";

import { createInvoice } from "../actions";

const NEW_PRODUCT_VALUE = "__new__";

const TYPE_TABS: { value: ProviderType; label: string }[] = [
  { value: "producto", label: t.providers.types.producto },
  { value: "servicio", label: t.providers.types.servicio },
];

interface UnitOption {
  id: string;
  code: string;
  name: string;
}

interface FormProduct {
  id: string;
  name: string;
  unitId: string;
  unitCode: string;
  currentPrice: string;
}

interface FormProvider {
  id: string;
  name: string;
  type: ProviderType;
  products: FormProduct[];
}

interface LineState {
  productId: string;
  quantity: string;
  unitPrice: string;
}

const emptyLine = (): LineState => ({ productId: "", quantity: "1", unitPrice: "" });

const todayLocal = (): string => {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
};

const numericInputClass =
  "w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-3 py-3 text-sm text-[#3d3530] focus:border-[#c4a77d] focus:outline-none";

export function InvoiceForm({
  providers,
  units,
}: {
  providers: FormProvider[];
  units: UnitOption[];
}): ReactElement {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<ProviderType>("producto");
  const [providerId, setProviderId] = useState("");
  const [date, setDate] = useState(todayLocal);
  const [number, setNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineState[]>([emptyLine()]);
  const [amount, setAmount] = useState("");
  const [editingLineIdx, setEditingLineIdx] = useState<number | null>(null);
  const [creatingLineIdx, setCreatingLineIdx] = useState<number | null>(null);
  // Holds products created during this session, keyed by provider, so they
  // appear in dropdowns immediately without waiting for router.refresh().
  const [newProductsByProvider, setNewProductsByProvider] = useState<
    Record<string, FormProduct[]>
  >({});

  const visibleProviders = useMemo(
    () => providers.filter((p) => p.type === type),
    [providers, type]
  );
  const provider = visibleProviders.find((p) => p.id === providerId);
  const products = useMemo(() => {
    const base = provider?.products ?? [];
    const extras = provider ? newProductsByProvider[provider.id] ?? [] : [];
    if (extras.length === 0) return base;
    const seen = new Set(base.map((p) => p.id));
    return [...base, ...extras.filter((p) => !seen.has(p.id))].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [provider, newProductsByProvider]);
  const productById = useMemo(() => {
    const map = new Map<string, FormProduct>();
    for (const p of products) map.set(p.id, p);
    return map;
  }, [products]);

  const linesTotal = lines.reduce(
    (sum, l) => sum + Number(l.unitPrice || 0) * Number(l.quantity || 0),
    0
  );
  const total = type === "servicio" ? Number(amount || 0) : linesTotal;

  function changeType(next: ProviderType): void {
    if (next === type) return;
    setType(next);
    setProviderId("");
    setLines([emptyLine()]);
    setAmount("");
    setError(null);
  }

  function changeProvider(id: string): void {
    setProviderId(id);
    setLines([emptyLine()]);
  }

  function updateLine(idx: number, patch: Partial<LineState>): void {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  function selectProduct(idx: number, selectedProductId: string): void {
    if (selectedProductId === NEW_PRODUCT_VALUE) {
      setCreatingLineIdx(idx);
      return;
    }
    const product = productById.get(selectedProductId);
    updateLine(idx, {
      productId: selectedProductId,
      unitPrice: product?.currentPrice ?? "",
    });
  }

  function handleProductCreated(idx: number, product: FormProduct): void {
    if (!provider) return;
    setNewProductsByProvider((prev) => {
      const existing = prev[provider.id] ?? [];
      if (existing.some((p) => p.id === product.id)) return prev;
      return { ...prev, [provider.id]: [...existing, product] };
    });
    setLines((prev) =>
      prev.map((l, i) =>
        i === idx ? { ...l, productId: product.id, unitPrice: product.currentPrice } : l
      )
    );
    setCreatingLineIdx(null);
    router.refresh();
  }

  function addLine(): void {
    setLines((prev) => [...prev, emptyLine()]);
  }

  function removeLine(idx: number): void {
    setLines((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));
  }

  function handleSubmit(e: React.SyntheticEvent): void {
    e.preventDefault();
    setError(null);

    if (!providerId) {
      setError(t.invoices.errors.selectProvider);
      return;
    }

    if (type === "servicio") {
      const amountNum = Number(amount);
      if (!isFinite(amountNum) || amountNum <= 0) {
        setError(t.invoices.errors.invalidAmount);
        return;
      }
      startTransition(async () => {
        try {
          const result = await createInvoice({
            providerId,
            date,
            number: number.trim() || null,
            notes: notes.trim() || null,
            amount,
          });
          if (!result.ok) {
            setError(result.error);
            return;
          }
          router.push("/");
        } catch (err) {
          setError(err instanceof Error ? err.message : t.invoices.errors.createFailed);
        }
      });
      return;
    }

    const payloadLines: {
      productId: string;
      unitId: string;
      unitPrice: string;
      quantity: string;
    }[] = [];
    for (const l of lines) {
      const product = productById.get(l.productId);
      if (!product) {
        setError(t.invoices.errors.lineNeedsProduct);
        return;
      }
      const price = Number(l.unitPrice);
      const qty = Number(l.quantity);
      if (!isFinite(price) || price <= 0) {
        setError(t.invoices.errors.invalidPriceFor(product.name));
        return;
      }
      if (!isFinite(qty) || qty <= 0) {
        setError(t.invoices.errors.invalidQuantityFor(product.name));
        return;
      }
      payloadLines.push({
        productId: product.id,
        unitId: product.unitId,
        unitPrice: l.unitPrice,
        quantity: l.quantity,
      });
    }

    startTransition(async () => {
      try {
        const result = await createInvoice({
          providerId,
          date,
          number: number.trim() || null,
          notes: notes.trim() || null,
          lines: payloadLines,
        });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        router.push("/");
      } catch (err) {
        setError(err instanceof Error ? err.message : t.invoices.errors.createFailed);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <section className="space-y-4 rounded-2xl bg-[#f5f0e8] p-6">
        <div>
          <label className="mb-2 block text-xs font-medium text-[#8b7355]">{t.invoices.fields.type}</label>
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white p-1">
            {TYPE_TABS.map((tab) => {
              const isActive = tab.value === type;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => { changeType(tab.value); }}
                  className={`rounded-xl py-2.5 text-center text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#c4a77d] text-white shadow-sm"
                      : "text-[#8b7355] hover:bg-[#f5f0e8]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label htmlFor="provider" className="mb-2 block text-xs font-medium text-[#8b7355]">
            {t.invoices.fields.provider}
          </label>
          <select
            id="provider"
            required
            value={providerId}
            onChange={(e) => { changeProvider(e.target.value); }}
            className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-3 text-sm text-[#3d3530] focus:border-[#c4a77d] focus:outline-none"
          >
            <option value="">
              {visibleProviders.length === 0
                ? type === "servicio"
                  ? t.invoices.fields.noProvidersOfService
                  : t.invoices.fields.noProvidersOfProduct
                : t.invoices.fields.providerPlaceholder}
            </option>
            {visibleProviders.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="date" className="mb-2 block text-xs font-medium text-[#8b7355]">
              {t.invoices.fields.date}
            </label>
            <input
              type="date"
              id="date"
              required
              value={date}
              onChange={(e) => { setDate(e.target.value); }}
              className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-3 py-3 text-sm text-[#3d3530] focus:border-[#c4a77d] focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="number" className="mb-2 block text-xs font-medium text-[#8b7355]">
              {t.invoices.fields.number}
            </label>
            <input
              type="text"
              id="number"
              value={number}
              onChange={(e) => { setNumber(e.target.value); }}
              placeholder={t.invoices.fields.numberPlaceholder}
              className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-3 py-3 text-sm text-[#3d3530] placeholder:text-[#c4a77d] focus:border-[#c4a77d] focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="mb-2 block text-xs font-medium text-[#8b7355]">
            {t.invoices.fields.notes}
          </label>
          <textarea
            id="notes"
            rows={2}
            value={notes}
            onChange={(e) => { setNotes(e.target.value); }}
            className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-3 py-3 text-sm text-[#3d3530] focus:border-[#c4a77d] focus:outline-none"
          />
        </div>
      </section>

      {type === "servicio" && (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-medium text-[#8b7355]">{t.invoices.fields.amount}</h2>
          </div>
          <div className="rounded-xl bg-white p-4">
            <label htmlFor="amount" className="mb-2 block text-xs font-medium text-[#8b7355]">
              {t.invoices.fields.amountPrompt}
            </label>
            <input
              id="amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              required
              disabled={!provider}
              value={amount}
              onChange={(e) => { setAmount(e.target.value); }}
              className={numericInputClass}
            />
          </div>
        </section>
      )}

      {type === "producto" && (
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-medium text-[#8b7355]">{t.invoices.lines.heading}</h2>
          <span className="text-xs text-[#c4a77d]">{t.invoices.lines.count(lines.length)}</span>
        </div>

        {lines.map((line, idx) => {
          const product = productById.get(line.productId);
          const isNewPrice =
            !!product &&
            !!line.unitPrice &&
            Number(line.unitPrice) !== Number(product.currentPrice);
          const lineTotal =
            Number(line.unitPrice || 0) * Number(line.quantity || 0);

          return (
            <div key={idx} className="space-y-3 rounded-xl bg-white p-4">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <label className="mb-2 block text-xs font-medium text-[#8b7355]">
                    {t.invoices.fields.product}
                  </label>
                  <select
                    required
                    disabled={!provider}
                    value={line.productId}
                    onChange={(e) => { selectProduct(idx, e.target.value); }}
                    className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-3 py-3 text-sm text-[#3d3530] focus:border-[#c4a77d] focus:outline-none disabled:bg-[#faf8f5] disabled:text-[#c4a77d]"
                  >
                    <option value="">
                      {provider ? t.invoices.fields.productPlaceholder : t.invoices.fields.pickProviderFirst}
                    </option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                    {provider && (
                      <option value={NEW_PRODUCT_VALUE}>{t.invoices.addProductOption}</option>
                    )}
                  </select>
                </div>
                <div className="mt-7 flex gap-2">
                  {product && (
                    <button
                      type="button"
                      onClick={() => { setEditingLineIdx(idx); }}
                      aria-label={t.invoices.editProduct.title}
                      title={t.invoices.editProduct.title}
                      className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f5f0e8] text-[#8b7355] hover:bg-[#e8e0d4]"
                    >
                      <PencilSquareIcon className="h-5 w-5" />
                    </button>
                  )}
                  {lines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => { removeLine(idx); }}
                      aria-label={t.invoices.lines.remove}
                      className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f5f0e8] text-[#8b7355] hover:bg-[#e8e0d4]"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="mb-2 block text-xs font-medium text-[#8b7355]">
                    {t.invoices.fields.quantity}
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    required
                    value={line.quantity}
                    onChange={(e) => { updateLine(idx, { quantity: e.target.value }); }}
                    className={numericInputClass}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium text-[#8b7355]">
                    {t.invoices.fields.unit}
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={product?.unitCode ?? "—"}
                    className="w-full rounded-xl border-2 border-[#e8e0d4] bg-[#faf8f5] px-3 py-3 text-sm text-[#8b7355]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium text-[#8b7355]">
                    {t.invoices.fields.unitPrice}
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    required
                    disabled={!product}
                    value={line.unitPrice}
                    onChange={(e) => { updateLine(idx, { unitPrice: e.target.value }); }}
                    className={numericInputClass}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[#f5f0e8] pt-3 text-sm">
                <div className="text-[#8b7355]">
                  {isNewPrice && (
                    <span className="text-amber-700">
                      {t.invoices.lines.newPrice(product.currentPrice)}
                    </span>
                  )}
                </div>
                <div className="font-medium text-[#3d3530]">
                  {t.invoices.lines.subtotal(lineTotal.toFixed(2))}
                </div>
              </div>
            </div>
          );
        })}

        <button
          type="button"
          onClick={addLine}
          disabled={!provider}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#c4a77d] py-3 text-sm font-medium text-[#c4a77d] hover:bg-white disabled:opacity-40"
        >
          <PlusIcon className="h-4 w-4" />
          {t.invoices.lines.add}
        </button>
      </section>
      )}

      <section className="rounded-2xl bg-[#f5f0e8] p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-[#8b7355]">{t.invoices.fields.total}</span>
          <span className="text-2xl font-light text-[#3d3530]">${total.toFixed(2)}</span>
        </div>

        <FormMessage message={error} className="mb-3" />

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl bg-[#c4a77d] py-4 text-base font-medium text-white shadow-sm active:scale-[0.99] disabled:opacity-50"
        >
          {isPending ? t.common.saving : t.invoices.create}
        </button>
      </section>

      {editingLineIdx !== null && provider && ((): ReactElement | null => {
        const line = lines[editingLineIdx];
        if (!line) return null;
        const product = productById.get(line.productId);
        if (!product) return null;
        return (
          <EditProductModal
            providerId={provider.id}
            product={product}
            units={units}
            initialPrice={line.unitPrice || product.currentPrice}
            onClose={() => { setEditingLineIdx(null); }}
            onSaved={(newPrice) => {
              updateLine(editingLineIdx, { unitPrice: newPrice });
              setEditingLineIdx(null);
              router.refresh();
            }}
          />
        );
      })()}

      {creatingLineIdx !== null && provider && (
        <AddProductModal
          providerId={provider.id}
          providerName={provider.name}
          units={units}
          onClose={() => { setCreatingLineIdx(null); }}
          onCreated={(product) => { handleProductCreated(creatingLineIdx, product); }}
        />
      )}
    </form>
  );
}

function EditProductModal({
  providerId,
  product,
  units,
  initialPrice,
  onClose,
  onSaved,
}: {
  providerId: string;
  product: FormProduct;
  units: UnitOption[];
  initialPrice: string;
  onClose: () => void;
  onSaved: (newPrice: string) => void;
}): ReactElement {
  const [unitId, setUnitId] = useState(product.unitId);
  const [price, setPrice] = useState(initialPrice);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(): Promise<void> {
    setError(null);
    const priceNum = Number(price);
    if (!isFinite(priceNum) || priceNum <= 0) {
      setError(t.invoices.errors.invalidPrice);
      return;
    }
    if (!unitId) {
      setError(t.invoices.errors.selectUnit);
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateProduct(providerId, product.id, {
        name: product.name,
        unitId,
        price,
      });
      if (!result.ok) {
        setError(result.error);
        setIsSaving(false);
        return;
      }
      onSaved(price);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.invoices.errors.saveFailed);
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium text-[#3d3530]">{t.invoices.editProduct.title}</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label={t.common.close}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f5f0e8] text-[#8b7355] hover:bg-[#e8e0d4]"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm text-[#8b7355]">{t.invoices.editProduct.hint}</p>

        <div className="mb-4">
          <p className="mb-2 text-xs font-medium text-[#8b7355]">{t.invoices.fields.product}</p>
          <p className="rounded-xl bg-[#faf8f5] px-4 py-3 text-sm text-[#3d3530]">
            {product.name}
          </p>
        </div>

        <div className="mb-4">
          <label htmlFor="modal-unit" className="mb-2 block text-xs font-medium text-[#8b7355]">
            {t.invoices.fields.unit}
          </label>
          <select
            id="modal-unit"
            value={unitId}
            onChange={(e) => { setUnitId(e.target.value); }}
            disabled={isSaving}
            className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-3 text-sm text-[#3d3530] focus:border-[#c4a77d] focus:outline-none"
          >
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label htmlFor="modal-price" className="mb-2 block text-xs font-medium text-[#8b7355]">
            {t.invoices.fields.unitPriceFull}
          </label>
          <input
            id="modal-price"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => { setPrice(e.target.value); }}
            disabled={isSaving}
            className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-3 text-sm text-[#3d3530] focus:border-[#c4a77d] focus:outline-none"
          />
        </div>

        <FormMessage message={error} className="mb-3" />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 rounded-xl border-2 border-[#e8e0d4] py-3 text-sm font-medium text-[#8b7355]"
          >
            {t.common.cancel}
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="flex-1 rounded-xl bg-[#c4a77d] py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            {isSaving ? t.common.saving : t.common.save}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddProductModal({
  providerId,
  providerName,
  units,
  onClose,
  onCreated,
}: {
  providerId: string;
  providerName: string;
  units: UnitOption[];
  onClose: () => void;
  onCreated: (product: FormProduct) => void;
}): ReactElement {
  const [name, setName] = useState("");
  const [unitId, setUnitId] = useState(units[0]?.id ?? "");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hint = t.products.addHint(providerName);

  async function handleSave(): Promise<void> {
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t.invoices.errors.nameRequired);
      return;
    }
    if (!unitId) {
      setError(t.invoices.errors.selectUnit);
      return;
    }
    const priceNum = Number(price);
    if (!isFinite(priceNum) || priceNum <= 0) {
      setError(t.invoices.errors.invalidPrice);
      return;
    }
    const quantityNum = Number(quantity);
    if (!isFinite(quantityNum) || quantityNum <= 0) {
      setError(t.invoices.errors.invalidQuantity);
      return;
    }

    setIsSaving(true);
    try {
      const result = await createProductForProvider(
        providerId,
        { name: trimmed, description: null, unitId },
        price,
        quantity
      );
      if (!result.ok) {
        setError(result.error);
        setIsSaving(false);
        return;
      }
      const unit = units.find((u) => u.id === unitId);
      onCreated({
        id: result.data.id,
        name: result.data.name,
        unitId,
        unitCode: unit?.code ?? "",
        currentPrice: price,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t.invoices.errors.productCreateFailed);
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium text-[#3d3530]">{t.products.newTitle}</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label={t.common.close}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f5f0e8] text-[#8b7355] hover:bg-[#e8e0d4]"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm text-[#8b7355]">
          {hint.before}
          <span className="font-medium text-[#3d3530]">{hint.name}</span>
          {hint.after}
        </p>

        <div className="mb-4">
          <label htmlFor="new-prod-name" className="mb-2 block text-xs font-medium text-[#8b7355]">
            {t.products.fields.name}
          </label>
          <input
            id="new-prod-name"
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); }}
            disabled={isSaving}
            autoFocus
            className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-3 text-sm text-[#3d3530] focus:border-[#c4a77d] focus:outline-none"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="new-prod-unit" className="mb-2 block text-xs font-medium text-[#8b7355]">
            {t.invoices.fields.unit}
          </label>
          <select
            id="new-prod-unit"
            value={unitId}
            onChange={(e) => { setUnitId(e.target.value); }}
            disabled={isSaving}
            className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-3 text-sm text-[#3d3530] focus:border-[#c4a77d] focus:outline-none"
          >
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="new-prod-price" className="mb-2 block text-xs font-medium text-[#8b7355]">
              {t.invoices.fields.unitPrice}
            </label>
            <input
              id="new-prod-price"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => { setPrice(e.target.value); }}
              disabled={isSaving}
              className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-3 text-sm text-[#3d3530] focus:border-[#c4a77d] focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="new-prod-quantity" className="mb-2 block text-xs font-medium text-[#8b7355]">
              {t.products.fields.packQuantity}
            </label>
            <input
              id="new-prod-quantity"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={quantity}
              onChange={(e) => { setQuantity(e.target.value); }}
              disabled={isSaving}
              className="w-full rounded-xl border-2 border-[#e8e0d4] bg-white px-4 py-3 text-sm text-[#3d3530] focus:border-[#c4a77d] focus:outline-none"
            />
          </div>
        </div>

        <FormMessage message={error} className="mb-3" />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 rounded-xl border-2 border-[#e8e0d4] py-3 text-sm font-medium text-[#8b7355]"
          >
            {t.common.cancel}
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="flex-1 rounded-xl bg-[#c4a77d] py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            {isSaving ? t.common.saving : t.products.createAndUse}
          </button>
        </div>
      </div>
    </div>
  );
}
