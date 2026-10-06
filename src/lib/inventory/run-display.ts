import Decimal from "decimal.js";

export function runChange(value: string | null, initial = false): string | null {
  if (initial) return null;
  if (value === null) return "Sin cantidad comparable en el inventario anterior";
  const delta = new Decimal(value);
  if (delta.isZero()) return "Sin cambios";
  return `${delta.isPositive() ? "+" : ""}${delta.toString()}`;
}

export function runDate(day: string): string {
  return new Intl.DateTimeFormat("es-UY", { timeZone: "America/Montevideo", dateStyle: "long" }).format(new Date(`${day}T12:00:00-03:00`));
}
