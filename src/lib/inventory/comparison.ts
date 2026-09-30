import Decimal from "decimal.js";

export interface CountSnapshot {
  quantity: string;
  unit: string;
  recordedAt: string;
}

export function inventoryDifference(current: CountSnapshot | null, previous: CountSnapshot | null): string | null {
  if (current === null || current.unit !== previous?.unit) return null;
  return new Decimal(current.quantity).minus(previous.quantity).toString();
}

export function inventoryDate(value: string): string {
  return new Intl.DateTimeFormat("es-UY", { timeZone: "America/Montevideo", dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
