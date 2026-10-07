import Decimal from "decimal.js";

export function runChange(value: string | null, initial = false): string | null {
  if (initial) return null;
  if (value === null) return "Sin cantidad comparable en el inventario anterior";
  const delta = new Decimal(value);
  if (delta.isZero()) return "Sin cambios";
  return `${delta.isPositive() ? "+" : ""}${delta.toString()}`;
}

/** Tuesday through Monday, using a local date rather than the host timezone. */
export function inventoryWeek(day: string): string {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 5) % 7);
  return date.toISOString().slice(0, 10);
}

export function runDate(day: string): string {
  const date = new Date(`${inventoryWeek(day)}T12:00:00Z`);
  const month = new Intl.DateTimeFormat("es-UY", { timeZone: "UTC", month: "long" }).format(date).toLocaleLowerCase("es-UY");
  return `Martes ${date.getUTCDate()} de ${month}`;
}
