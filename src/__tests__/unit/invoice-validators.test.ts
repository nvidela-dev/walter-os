import { describe, expect, it } from "vitest";

import { createInvoiceSchema, invoiceProductSchema } from "@/lib/validators/invoices";

const providerId = "d46ea49c-1eb9-44f6-923a-e82f7a46ae3b";
const productId = "5ac23a65-cc36-410d-a92d-5c84944d638c";

describe("invoice validators", () => {
  it("accepts service invoices with a positive amount", () => {
    expect(
      createInvoiceSchema.parse({
        providerId,
        date: "2026-06-04",
        number: "",
        notes: "",
        amount: "12.3",
      })
    ).toEqual({
      providerId,
      date: "2026-06-04",
      number: null,
      notes: null,
      amount: "12.30",
    });
  });

  it("keeps product invoice input limited to server-owned fields", () => {
    const parsed = invoiceProductSchema.parse({
      providerId,
      date: "2026-06-04",
      number: null,
      notes: null,
      lines: [
        {
          productId,
          unitId: "a45e74bd-b34e-4d5c-aad6-aa8f77f14e15",
          unitPrice: "1.5",
          quantity: "2",
        },
      ],
    });

    expect(parsed.lines[0]).toEqual({
      productId,
      unitPrice: "1.50",
      quantity: "2.000",
    });
    expect(parsed.lines[0]).not.toHaveProperty("unitId");
  });

  it("rejects empty product invoices and nonpositive service amounts", () => {
    expect(
      createInvoiceSchema.safeParse({ providerId, date: "2026-06-04", lines: [] }).success
    ).toBe(false);
    expect(
      createInvoiceSchema.safeParse({ providerId, date: "2026-06-04", amount: "0" }).success
    ).toBe(false);
  });
});
