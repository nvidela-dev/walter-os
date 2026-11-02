import { normalizeMatchName, suggestMatch } from "./product-matching";

export interface DuplicateProduct {
  id: string;
  name: string;
  unit: string;
  deletedAt: string | null;
  createdAt: string;
  providers: { id: string; name: string; price: string | null }[];
  placements: { number: number; note: string | null; active: boolean }[];
  observations: number;
  invoices: number;
  latestCounts?: { number: number; quantity: string; unit: string; recordedAt: string }[];
}
export interface DuplicateSuggestion { score: number; reason: string }
function distance(a: string, b: string): number {
  let row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++) next[j] = Math.min((next[j - 1] ?? 0) + 1, (row[j] ?? 0) + 1, (row[j - 1] ?? 0) + (a[i - 1] === b[j - 1] ? 0 : 1));
    row = next;
  }
  return row[b.length] ?? 0;
}
export function suggestDuplicate(a: DuplicateProduct, b: DuplicateProduct): DuplicateSuggestion | null {
  if (a.id === b.id || a.deletedAt !== null || b.deletedAt !== null) return null;
  const left = normalizeMatchName(a.name), right = normalizeMatchName(b.name);
  const leftSizes = left.match(/\d+/g), rightSizes = right.match(/\d+/g);
  if (leftSizes !== null && rightSizes !== null && leftSizes.join(",") !== rightSizes.join(",")) return null;
  if (["varios", "sin detalle", "verduras y frutas"].includes(left) || ["varios", "sin detalle", "verduras y frutas"].includes(right)) return null;
  const supplier = a.providers.some(p => b.providers.some(q => q.id === p.id));
  const fridge = a.placements.some(p => p.active && b.placements.some(q => q.active && q.number === p.number));
  let score = 0, reason = "";
  if (left === right) { score = 80; reason = "Mismo nombre, ignorando tildes y espacios."; }
  else {
    const mapped = suggestMatch(a, { ...b, provider: "" }) ?? suggestMatch(b, { ...a, provider: "" });
    if (mapped !== null && !mapped.reason.startsWith("Comparte las palabras principales")) { score = 45; reason = mapped.reason; }
    else if (Math.min(left.length, right.length) >= 5 && distance(left, right) <= (Math.min(left.length, right.length) > 10 ? 2 : 1)) { score = 40; reason = "Posible variante de escritura; confirmar variedad."; }
  }
  if (!score) return null;
  if (supplier) { score += 10; reason += " Mismo proveedor."; }
  if (fridge) { score += 10; reason += " Misma heladera activa."; }
  if (a.unit !== b.unit) reason += " Unidades distintas; revisar presentación.";
  if (Math.abs(Date.parse(a.createdAt) - Date.parse(b.createdAt)) <= 120000) reason += " Creados con menos de dos minutos de diferencia.";
  return { score, reason };
}
