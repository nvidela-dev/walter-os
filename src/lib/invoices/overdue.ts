/**
 * Bill "overdue" rule.
 *
 * An unpaid bill becomes overdue once at least one Sunday has fully passed
 * since its date. Sunday is the restaurant's weekly settlement marker: if a
 * bill was issued and a Sunday came and went without payment, it's late.
 *
 * Comparison is date-only — the `facturas.fecha` column carries no time — and
 * uses local dates on both sides, so it never drifts by a timezone offset.
 */

/** Parse a `YYYY-MM-DD` string into a local-midnight Date, or null if malformed. */
function parseDateOnly(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (match === null) return null;
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

/** Strip the time component, keeping the local calendar day. */
function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** The first Sunday strictly after `date` (a bill issued on a Sunday waits a week). */
function firstSundayAfter(date: Date): Date {
  const weekday = date.getDay(); // 0 = Sunday
  const daysUntilSunday = weekday === 0 ? 7 : 7 - weekday;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + daysUntilSunday);
}

/** True when a Sunday after `billDate` is already in the past relative to `now`. */
export function hasSundayPassedSince(billDate: string, now: Date): boolean {
  const bill = parseDateOnly(billDate);
  if (bill === null) return false;
  return firstSundayAfter(bill).getTime() < startOfDay(now).getTime();
}

/** An unpaid bill is overdue once a Sunday has passed since its date. */
export function isInvoiceOverdue(billDate: string, paid: boolean, now: Date = new Date()): boolean {
  if (paid) return false;
  return hasSundayPassedSince(billDate, now);
}
