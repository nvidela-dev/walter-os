import { expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { extractInvoice, readPhoto } from "@/lib/invoice-photo/extract";
import { invoiceDraftTotal, reviewedTotalMatches } from "@/lib/invoice-photo/review";
import { exactNameMatch, extractedInvoiceSchema, MAX_PHOTO_BYTES } from "@/lib/invoice-photo/schema";

const draft = { supplier: null, date: null, number: null, currency: null, total: null, tax: null, discount: null, adjustments: null, warnings: ["Fecha ilegible"], lines: [{ description: "Arroz", quantity: null, unit: null, unitPrice: null, total: null }] };

it("preserves unknown fields and rejects invented/invalid dates and excess lines", () => {
  expect(extractedInvoiceSchema.parse(draft)).toEqual(draft);
  expect(extractedInvoiceSchema.safeParse({ ...draft, date: "2026-02-30" }).success).toBe(false);
  expect(extractedInvoiceSchema.safeParse({ ...draft, lines: Array.from({ length: 101 }, () => draft.lines[0]) }).success).toBe(false);
});
it("only suggests a unique normalized name, never a fuzzy or ambiguous identity", () => {
  expect(exactNameMatch("GENÜSSE", [{ name: "Genüsse", id: 1 }])?.id).toBe(1);
  expect(exactNameMatch("Rice", [{ name: "Rice pack" }])).toBeUndefined();
  expect(exactNameMatch("Rice", [{ name: "Rice" }, { name: "rice" }])).toBeUndefined();
  expect(exactNameMatch(null, [{ name: "" }])).toBeUndefined();
});
it("compares totals using per-line money rounding, and blocks missing/tax-discrepant totals", () => {
  expect(reviewedTotalMatches([{ quantity: "3", unitPrice: "0.10" }], "0.30")).toBe(true);
  expect(reviewedTotalMatches([{ quantity: "0.333", unitPrice: "1.00" }, { quantity: "0.333", unitPrice: "1.00" }], "0.66")).toBe(true);
  expect(reviewedTotalMatches([{ quantity: "1", unitPrice: "100" }], "122")).toBe(false);
  expect(reviewedTotalMatches([{ quantity: "", unitPrice: "100" }], "100")).toBe(false);
  expect(reviewedTotalMatches("100", "")).toBe(false);
  expect(invoiceDraftTotal([{ quantity: "0.333", unitPrice: "1.00" }, { quantity: "0.333", unitPrice: "1.00" }])).toBe("0.66");
});
it("bounds uploads even without a length header and verifies magic bytes against type", async () => {
  await expect(readPhoto(new Request("http://localhost", { method: "POST", headers: { "content-type": "image/jpeg" }, body: new Uint8Array(MAX_PHOTO_BYTES + 1) }))).rejects.toThrow();
  await expect(readPhoto(new Request("http://localhost", { method: "POST", headers: { "content-type": "image/jpeg" }, body: "not an image" }))).rejects.toThrow();
  const bytes = new Uint8Array([255, 216, 255, 1]);
  expect(await readPhoto(new Request("http://localhost", { method: "POST", headers: { "content-type": "image/jpeg" }, body: bytes }))).toEqual(Buffer.from(bytes));
});
it("uses a server-only bounded Responses request and validates extracted output", async () => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(draft) }] }] }));
  expect(await extractInvoice(new Uint8Array([255, 216, 255]), "test-key", fetcher)).toEqual(draft);
  const sentBody = fetcher.mock.calls[0]?.[1]?.body;
  if (typeof sentBody !== "string") throw new Error("Missing request body");
  const body: unknown = JSON.parse(sentBody);
  expect(body).toMatchObject({ store: false, max_output_tokens: 8000, text: { format: { type: "json_schema", strict: true } } });
  expect(fetcher.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal);
  fetcher.mockResolvedValueOnce(Response.json({ status: "incomplete", output: [] }));
  await expect(extractInvoice(new Uint8Array(), "test-key", fetcher)).rejects.toThrow();
  fetcher.mockResolvedValueOnce(Response.json({ status: "completed", output: [{ type: "message", content: [{ type: "refusal" }] }] }));
  await expect(extractInvoice(new Uint8Array(), "test-key", fetcher)).rejects.toThrow("refused");
});
