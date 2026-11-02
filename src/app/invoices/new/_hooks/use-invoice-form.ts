"use client";

import { useRouter } from "next/navigation";
import { type SyntheticEvent, useMemo, useRef, useState, useTransition } from "react";

import { t } from "@/i18n";
import { createInvoice } from "@/lib/actions/invoices";
import { invoiceDraftTotal, reviewedTotalMatches } from "@/lib/invoice-photo/review";
import { exactNameMatch, type ExtractedInvoice } from "@/lib/invoice-photo/schema";
import type { InvoiceFormProduct, InvoiceFormProvider } from "@/lib/types/invoices";
import type { ProviderType } from "@/lib/types/providers";

import { type InvoiceLineDraft, NEW_PRODUCT_VALUE } from "../_components/types";

const emptyLine = (): InvoiceLineDraft => ({ productId: "", quantity: "1", unitPrice: "" });

const todayLocal = (): string => {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
};

export interface InvoiceFormController {
  loadPhoto: (data: ExtractedInvoice) => void;
  photo: ExtractedInvoice | null;
  reviewedTotal: string;
  setReviewedTotal: (value: string) => void;
  reviewed: boolean;
  setReviewed: (value: boolean) => void;
  addLine: () => void;
  amount: string;
  changeProvider: (id: string) => void;
  changeType: (type: ProviderType) => void;
  creatingLineIdx: number | null;
  date: string;
  editingLineIdx: number | null;
  error: string | null;
  handleProductCreated: (idx: number, product: InvoiceFormProduct) => void;
  handleProductSaved: (idx: number, newPrice: string) => void;
  handleSubmit: (event: SyntheticEvent<HTMLFormElement>) => void;
  isPending: boolean;
  lines: InvoiceLineDraft[];
  notes: string;
  number: string;
  products: InvoiceFormProduct[];
  provider: InvoiceFormProvider | undefined;
  providerId: string;
  removeLine: (idx: number) => void;
  selectProduct: (idx: number, productId: string) => void;
  setAmount: (value: string) => void;
  setCreatingLineIdx: (value: number | null) => void;
  setDate: (value: string) => void;
  setEditingLineIdx: (value: number | null) => void;
  setNotes: (value: string) => void;
  setNumber: (value: string) => void;
  total: number;
  type: ProviderType;
  updateLine: (idx: number, patch: Partial<InvoiceLineDraft>) => void;
  visibleProviders: InvoiceFormProvider[];
}

export function useInvoiceForm(providers: InvoiceFormProvider[]): InvoiceFormController {
  const router = useRouter();
  const submissionId = useRef<string | null>(null);
  const submitting = useRef(false);
  const [saved, setSaved] = useState(false);
  const [photo, setPhoto] = useState<ExtractedInvoice | null>(null);
  const [reviewedTotal, setReviewedTotal] = useState("");
  const [reviewedFingerprint, setReviewedFingerprint] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<ProviderType>("producto");
  const [providerId, setProviderId] = useState("");
  const [date, setDate] = useState(todayLocal);
  const [number, setNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<InvoiceLineDraft[]>([emptyLine()]);
  const [amount, setAmount] = useState("");
  const [editingLineIdx, setEditingLineIdx] = useState<number | null>(null);
  const [creatingLineIdx, setCreatingLineIdx] = useState<number | null>(null);
  const [newProductsByProvider, setNewProductsByProvider] = useState<
    Record<string, InvoiceFormProduct[]>
  >({});

  const visibleProviders = useMemo(
    () => providers.filter((provider) => provider.type === type),
    [providers, type]
  );
  const provider = visibleProviders.find((entry) => entry.id === providerId);
  const products = useMemo(() => {
    const base = provider?.products ?? [];
    const extras = provider ? newProductsByProvider[provider.id] ?? [] : [];
    if (extras.length === 0) return base;
    const seen = new Set(base.map((product) => product.id));
    return [...base, ...extras.filter((product) => !seen.has(product.id))].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [provider, newProductsByProvider]);
  const productById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products]
  );

  const total = Number(invoiceDraftTotal(type === "servicio" ? amount : lines.map((line) => ({
    quantity: line.quantity || "0", unitPrice: line.unitPrice || "0",
  }))) ?? "0");

  const fingerprint = JSON.stringify({ type, providerId, date, number, notes, lines, amount, reviewedTotal });
  const reviewed = reviewedFingerprint === fingerprint;
  function setReviewed(value: boolean): void { setReviewedFingerprint(value ? fingerprint : null); }
  function loadPhoto(data: ExtractedInvoice): void {
    const matched = exactNameMatch(data.supplier, providers);
    setPhoto(data);
    setType(matched?.type ?? "producto");
    setProviderId(matched?.id ?? "");
    setDate(data.date ?? "");
    setNumber(data.number ?? "");
    setNotes("");
    setAmount(matched?.type === "servicio" ? data.total ?? "" : "");
    setReviewedTotal(data.total ?? "");
    setReviewedFingerprint(null);
    setLines(data.lines.length > 0 ? data.lines.map((line) => ({
      productId: exactNameMatch(line.description, matched?.products ?? [])?.id ?? "",
      quantity: line.quantity ?? "",
      unitPrice: line.unitPrice ?? "",
      source: line,
    })) : [{ productId: "", quantity: "", unitPrice: "" }]);
    setError(null);
  }

  function changeType(next: ProviderType): void {
    if (next === type) return;
    setType(next);
    setProviderId("");
    setLines((current) => photo === null ? [emptyLine()] : current.map((line) => ({ ...line, productId: "" })));
    setAmount("");
    setError(null);
  }

  function changeProvider(id: string): void {
    setProviderId(id);
    setLines((current) => photo === null ? [emptyLine()] : current.map((line) => ({ ...line, productId: "" })));
  }

  function updateLine(idx: number, patch: Partial<InvoiceLineDraft>): void {
    setLines((current) =>
      current.map((line, index) => (index === idx ? { ...line, ...patch } : line))
    );
  }

  function selectProduct(idx: number, selectedProductId: string): void {
    if (selectedProductId === NEW_PRODUCT_VALUE) {
      setCreatingLineIdx(idx);
      return;
    }
    const product = productById.get(selectedProductId);
    updateLine(idx, {
      productId: selectedProductId,
      unitPrice: photo === null ? product?.currentPrice ?? "" : lines[idx]?.unitPrice ?? "",
    });
  }

  function handleProductCreated(idx: number, product: InvoiceFormProduct): void {
    if (!provider) return;
    setNewProductsByProvider((current) => {
      const existing = current[provider.id] ?? [];
      if (existing.some((entry) => entry.id === product.id)) return current;
      return { ...current, [provider.id]: [...existing, product] };
    });
    setLines((current) =>
      current.map((line, index) =>
        index === idx
          ? { ...line, productId: product.id, unitPrice: product.currentPrice }
          : line
      )
    );
    setCreatingLineIdx(null);
    router.refresh();
  }

  function handleProductSaved(idx: number, newPrice: string): void {
    updateLine(idx, { unitPrice: newPrice });
    setEditingLineIdx(null);
    router.refresh();
  }

  function addLine(): void {
    setLines((current) => [...current, emptyLine()]);
  }

  function removeLine(idx: number): void {
    setLines((current) =>
      current.length === 1 ? current : current.filter((_, index) => index !== idx)
    );
  }

  function handleSubmit(e: SyntheticEvent<HTMLFormElement>): void {
    e.preventDefault();
    if (submitting.current || saved) return;
    setError(null);
    if (photo !== null && (!reviewed || !reviewedTotalMatches(type === "servicio" ? amount : lines, reviewedTotal))) {
      setError("Revisá los datos y unidades, confirmá la moneda y corregí la diferencia con el total final antes de guardar.");
      return;
    }

    if (!providerId) {
      setError(t.invoices.errors.selectProvider);
      return;
    }

    if (type === "servicio") {
      const amountNumber = Number(amount);
      if (!isFinite(amountNumber) || amountNumber <= 0) {
        setError(t.invoices.errors.invalidAmount);
        return;
      }
      submitting.current = true;
      submissionId.current ??= crypto.randomUUID();
      startTransition(async () => {
        try {
          const result = await createInvoice({
            providerId,
            date,
            number: number.trim() || null,
            notes: notes.trim() || null,
            amount,
          }, { submissionId: submissionId.current, reviewedTotal: photo === null ? undefined : reviewedTotal });
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setSaved(true);
          router.push("/invoices");
        } catch {
          setError(t.invoices.errors.createFailed);
        } finally { submitting.current = false; }
      });
      return;
    }

    const payloadLines: { productId: string; unitPrice: string; quantity: string }[] = [];
    for (const line of lines) {
      const product = productById.get(line.productId);
      if (!product) {
        setError(t.invoices.errors.lineNeedsProduct);
        return;
      }
      const price = Number(line.unitPrice);
      const quantity = Number(line.quantity);
      if (!isFinite(price) || price <= 0) {
        setError(t.invoices.errors.invalidPriceFor(product.name));
        return;
      }
      if (!isFinite(quantity) || quantity <= 0) {
        setError(t.invoices.errors.invalidQuantityFor(product.name));
        return;
      }
      payloadLines.push({
        productId: product.id,
        unitPrice: line.unitPrice,
        quantity: line.quantity,
      });
    }

    submitting.current = true;
    submissionId.current ??= crypto.randomUUID();
    startTransition(async () => {
      try {
        const result = await createInvoice({
          providerId,
          date,
          number: number.trim() || null,
          notes: notes.trim() || null,
          lines: payloadLines,
        }, { submissionId: submissionId.current, reviewedTotal: photo === null ? undefined : reviewedTotal });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setSaved(true);
        router.push("/invoices");
      } catch {
        setError(t.invoices.errors.createFailed);
      } finally { submitting.current = false; }
    });
  }

  return {
    photo, loadPhoto, reviewedTotal, setReviewedTotal, reviewed, setReviewed,
    addLine,
    amount,
    changeProvider,
    changeType,
    creatingLineIdx,
    date,
    editingLineIdx,
    error,
    handleProductCreated,
    handleProductSaved,
    handleSubmit,
    isPending: isPending || saved,
    lines,
    notes,
    number,
    products,
    provider,
    providerId,
    removeLine,
    selectProduct,
    setAmount,
    setCreatingLineIdx,
    setDate,
    setEditingLineIdx,
    setNotes,
    setNumber,
    total,
    type,
    updateLine,
    visibleProviders,
  };
}
