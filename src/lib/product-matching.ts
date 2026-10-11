export interface MatchProduct { id: string; name: string; unit: string }
export type CatalogueProduct = MatchProduct & { provider: string };
export interface MatchDecision { inventoryId: string; catalogueId: string; status: string }
export function normalizeMatchName(name: string): string {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
// Prepared by reading the October 2026 catalogue. These are hypotheses, never confirmations.
const hypotheses: [string[], string[], string][] = [
  [["Kassler"], ["Kasler"], "Parece una variante de escritura del mismo fiambre."],
  [["Nuggets"], ["Nuguet"], "Parece una variante de escritura de nuggets."],
  [["Rústicas"], ["Papa rustica"], "Probablemente papas rústicas; confirmar presentación."],
  [["Fritas"], ["Papá fritas tradicional"], "Probablemente papas fritas; confirmar corte y presentación."],
  [["Cebolla picada"], ["Cebolla en cubos"], "Misma verdura, pero el tamaño del corte puede cambiar."],
  [["Choclo"], ["Maíz"], "Choclo y maíz pueden nombrar el mismo ingrediente; confirmar presentación."],
  [["Mix morrones"], ["Mix morrón"], "Mismo concepto, escrito en plural."],
  [["Supremas"], ["Suprema"], "Mismo nombre en plural; confirmar preparación."],
  [["Salchichas", "Panchos"], ["Salchicha"], "Posible mismo producto; confirmar tipo y presentación."],
  [["Pan molde celíaco"], ["Molde celíacos"], "Pan de molde para celíacos, con distinto orden de palabras."],
  [["Tortugas celíaco"], ["Tortugas celíacos"], "Mismo pan para celíacos, escrito en plural."],
  [["Sorrentinos celíaco"], ["Sorrentinos"], "El proveedor es de celíacos, pero el nombre no especifica relleno ni condición."],
  [["Pan molde blanco"], ["Molde para Sándwiches"], "Posible pan de molde blanco; confirmar variedad."],
  [["Cheddar"], ["Queso Cheddar Lover - En Barra", "Queso Cheddar Untable 500G"], "Ambos son cheddar, pero barra y untable son alternativas distintas."],
  [["4 quesos"], ["Salsa La Positiva 4 Quesos"], "Podría ser la salsa de cuatro quesos; confirmar que no sea otro preparado."],
  [["Champiniones"], ["Lata champi"], "Champiñones, posiblemente en lata; confirmar presentación."],
  [["Mila carne"], ["Milanesas"], "Mila suele abreviar milanesa; la carnicería no especifica la carne."],
  [["Pollo picado"], ["Cubos de pollo asado"], "Ambos son pollo trozado, pero asado y picado pueden ser productos distintos."],
  [["Aceite", "Aceite freidora"], ["Aceite común"], "Podría ser el aceite común; confirmar uso y tipo."],
];
export function suggestMatch(item: MatchProduct, candidate: CatalogueProduct): { exact: boolean; reason: string } | null {
  const a = normalizeMatchName(item.name), b = normalizeMatchName(candidate.name);
  if (item.id === candidate.id || a === b) return { exact: true, reason: item.id === candidate.id ? "Ya es el mismo producto del catálogo." : "Mismo nombre, ignorando tildes, espacios y mayúsculas." };
  for (const [sources, targets, reason] of hypotheses) {
    if (sources.some(n => normalizeMatchName(n) === a) && targets.some(n => normalizeMatchName(n) === b)) return { exact: false, reason };
  }
  const words = a.split(" ").filter(w => w.length > 3);
  if (words.length && words.every(w => b.split(" ").includes(w))) return { exact: false, reason: "Comparte las palabras principales; revisá variedad y presentación." };
  return null;
}
