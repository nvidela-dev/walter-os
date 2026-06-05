import { describe, expect, it } from "vitest";

import { hasSundayPassedSince, isInvoiceOverdue } from "@/lib/invoices/overdue";

// 2026-06-01 is a Monday; the first Sunday after it is 2026-06-07.
const MONDAY = "2026-06-01";
const SUNDAY = "2026-06-07";

describe("hasSundayPassedSince", () => {
  it("is false before the upcoming Sunday", () => {
    expect(hasSundayPassedSince(MONDAY, new Date(2026, 5, 5))).toBe(false); // Fri
  });

  it("is false on that Sunday itself (it hasn't passed yet)", () => {
    expect(hasSundayPassedSince(MONDAY, new Date(2026, 5, 7))).toBe(false);
  });

  it("is true the day after that Sunday", () => {
    expect(hasSundayPassedSince(MONDAY, new Date(2026, 5, 8))).toBe(true); // Mon
  });

  it("treats a bill dated on a Sunday as waiting for the next Sunday", () => {
    expect(hasSundayPassedSince(SUNDAY, new Date(2026, 5, 13))).toBe(false); // Sat
    expect(hasSundayPassedSince(SUNDAY, new Date(2026, 5, 14))).toBe(false); // next Sun itself
    expect(hasSundayPassedSince(SUNDAY, new Date(2026, 5, 15))).toBe(true); // Mon after
  });

  it("returns false for a malformed date", () => {
    expect(hasSundayPassedSince("not-a-date", new Date(2026, 5, 30))).toBe(false);
  });
});

describe("isInvoiceOverdue", () => {
  it("is never overdue when paid, even long after a Sunday", () => {
    expect(isInvoiceOverdue(MONDAY, true, new Date(2026, 6, 1))).toBe(false);
  });

  it("is overdue when unpaid and a Sunday has passed", () => {
    expect(isInvoiceOverdue(MONDAY, false, new Date(2026, 5, 8))).toBe(true);
  });

  it("is not overdue when unpaid but no Sunday has passed yet", () => {
    expect(isInvoiceOverdue(MONDAY, false, new Date(2026, 5, 5))).toBe(false);
  });
});
