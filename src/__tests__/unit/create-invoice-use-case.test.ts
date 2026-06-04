import { describe, expect, it, vi } from "vitest";

import { t } from "@/i18n";
import {
  type CreateInvoiceDependencies,
  createInvoiceUseCase,
} from "@/lib/use-cases/invoices/create-invoice";
import { createInvoiceSchema } from "@/lib/validators/invoices";

const providerId = "d46ea49c-1eb9-44f6-923a-e82f7a46ae3b";
const productId = "5ac23a65-cc36-410d-a92d-5c84944d638c";
const secondProductId = "85ba8d1f-3b99-47d2-b802-8d64dc2e2df9";
const unitId = "a45e74bd-b34e-4d5c-aad6-aa8f77f14e15";
const invoiceId = "e70d05f4-d7cb-4bca-a49e-b25938f93b7f";

function createDependencies(
  overrides: Partial<CreateInvoiceDependencies> = {}
): CreateInvoiceDependencies {
  return {
    newId: vi.fn(() => invoiceId),
    getProvider: vi.fn(async () => ({ id: providerId, type: "producto" as const })),
    getCatalogProducts: vi.fn(async () => [
      { productId, unitId },
      { productId: secondProductId, unitId },
    ]),
    insertServiceInvoice: vi.fn(async () => {}),
    insertProductInvoice: vi.fn(async () => {}),
    ...overrides,
  };
}

describe("createInvoiceUseCase", () => {
  it("creates a service invoice without product persistence", async () => {
    const dependencies = createDependencies({
      getProvider: vi.fn(async () => ({ id: providerId, type: "servicio" as const })),
    });
    const input = createInvoiceSchema.parse({
      providerId,
      date: "2026-06-04",
      number: "A-1",
      notes: null,
      amount: "120",
    });

    await expect(createInvoiceUseCase(input, dependencies)).resolves.toEqual({ id: invoiceId });
    expect(dependencies.insertServiceInvoice).toHaveBeenCalledWith({
      id: invoiceId,
      providerId,
      date: "2026-06-04",
      number: "A-1",
      notes: null,
      amount: "120.00",
    });
    expect(dependencies.insertProductInvoice).not.toHaveBeenCalled();
  });

  it("derives units, totals, and latest product prices for product invoices", async () => {
    const dependencies = createDependencies();
    const input = createInvoiceSchema.parse({
      providerId,
      date: "2026-06-04",
      number: null,
      notes: null,
      lines: [
        { productId, unitPrice: "0.10", quantity: "0.20" },
        { productId: secondProductId, unitPrice: "2", quantity: "1" },
        { productId, unitPrice: "0.30", quantity: "1" },
      ],
    });

    await createInvoiceUseCase(input, dependencies);

    expect(dependencies.insertProductInvoice).toHaveBeenCalledWith({
      id: invoiceId,
      providerId,
      date: "2026-06-04",
      number: null,
      notes: null,
      total: "2.32",
      lines: [
        { productId, unitId, unitPrice: "0.10", quantity: "0.200", total: "0.02" },
        {
          productId: secondProductId,
          unitId,
          unitPrice: "2.00",
          quantity: "1.000",
          total: "2.00",
        },
        { productId, unitId, unitPrice: "0.30", quantity: "1.000", total: "0.30" },
      ],
      latestPrices: [
        { productId, price: "0.30" },
        { productId: secondProductId, price: "2.00" },
      ],
    });
  });

  it("rejects provider type mismatches and unowned products", async () => {
    const serviceProvider = createDependencies({
      getProvider: vi.fn(async () => ({ id: providerId, type: "servicio" as const })),
    });
    const productInput = createInvoiceSchema.parse({
      providerId,
      date: "2026-06-04",
      lines: [{ productId, unitPrice: "1", quantity: "1" }],
    });
    await expect(createInvoiceUseCase(productInput, serviceProvider)).rejects.toThrow(
      t.errors.invoice.productNeedsProductProvider
    );

    const missingProduct = createDependencies({
      getCatalogProducts: vi.fn(async () => []),
    });
    await expect(createInvoiceUseCase(productInput, missingProduct)).rejects.toThrow(
      t.errors.invoice.lineProductNotForProvider
    );
  });
});
