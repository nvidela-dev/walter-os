import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

import type { ExtractedInvoice } from "@/lib/invoice-photo/schema";

const photo: ExtractedInvoice = { supplier: "Supplier", date: "2026-10-18", number: "A-12", currency: "UYU", total: "25.00", tax: null, discount: null, adjustments: null, warnings: ["Verificar envase"], lines: [{ description: "Rice", quantity: "2", unit: "unidad", unitPrice: "12.50", total: "25.00" }] };
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/lib/actions/invoices", () => ({ createInvoice: vi.fn() }));
vi.mock("@/app/invoices/new/_components/add-product-modal", () => ({ AddProductModal: () => null }));
vi.mock("@/app/invoices/new/_components/edit-product-modal", () => ({ EditProductModal: () => null }));
vi.mock("@/app/invoices/new/_components/invoice-photo", () => ({ InvoicePhoto: ({ onExtracted }: { onExtracted: (data: ExtractedInvoice) => void }) => <button type="button" onClick={() => { onExtracted(photo); }}>Leer foto</button> }));

import { InvoiceForm } from "@/app/invoices/new/invoice-form";
import { t } from "@/i18n";
import { createInvoice } from "@/lib/actions/invoices";

const providers = [{ id: "b6c2ff6f-e902-493a-aea6-2d58d4e40c3c", name: "Supplier", type: "producto", products: [{ id: "84dbf563-200f-42cf-8874-5291fa97a6d6", name: "Rice", unitId: "u", unitCode: "unidad", currentPrice: "99.00" }] }] satisfies Parameters<typeof InvoiceForm>[0]["providers"];
beforeEach(() => { vi.clearAllMocks(); vi.mocked(createInvoice).mockResolvedValue({ ok: false, error: "Retry" }); });
it("requires explicit review, keeps extracted prices when matching, and invalidates approval after edits", async () => {
  render(<InvoiceForm providers={providers} units={[]} />);
  fireEvent.click(screen.getByText("Leer foto"));
  expect(screen.getByLabelText(t.invoices.fields.unitPrice)).toHaveValue(12.5);
  expect(screen.getByText("Verificar envase", { exact: false })).toBeInTheDocument();
  const save = screen.getByRole("button", { name: t.invoices.create });
  fireEvent.click(save);
  expect(createInvoice).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText(t.invoices.fields.product), { target: { value: "84dbf563-200f-42cf-8874-5291fa97a6d6" } });
  expect(screen.getByLabelText(t.invoices.fields.unitPrice)).toHaveValue(12.5);
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.change(screen.getByLabelText(t.invoices.fields.number), { target: { value: "A-13" } });
  expect(screen.getByRole("checkbox")).not.toBeChecked();
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(save);
  await waitFor(() => { expect(createInvoice).toHaveBeenCalledTimes(1); });
  expect(createInvoice).toHaveBeenCalledWith(expect.objectContaining({ lines: [{ productId: "84dbf563-200f-42cf-8874-5291fa97a6d6", quantity: "2", unitPrice: "12.50" }] }), expect.objectContaining({ reviewedTotal: "25.00" }));
  await screen.findByText("Retry");
  await waitFor(() => { expect(save).toBeEnabled(); });
  fireEvent.click(save);
  await waitFor(() => { expect(createInvoice).toHaveBeenCalledTimes(2); });
  expect(vi.mocked(createInvoice).mock.calls[1]?.[1]).toEqual(vi.mocked(createInvoice).mock.calls[0]?.[1]);
});
it("blocks approval when final total differs from reviewed line values", () => {
  render(<InvoiceForm providers={providers} units={[]} />);
  fireEvent.click(screen.getByText("Leer foto"));
  fireEvent.change(screen.getByLabelText("Total final verificado en la factura (UYU)"), { target: { value: "30.50" } });
  expect(screen.getByRole("checkbox")).toBeDisabled();
  expect(screen.getByRole("alert")).toHaveTextContent("no coincide");
});
