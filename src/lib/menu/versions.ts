import Decimal from "decimal.js";
import { z } from "zod";

import { requiredTextSchema, uuidSchema } from "@/lib/validation";
import { menuItemInputSchema } from "@/lib/validators/menu";

export const menuDocumentSchema = z.object({
  sections: z.array(z.object({id: uuidSchema, name: requiredTextSchema, sortOrder: z.number().int().min(0).max(10000)})).max(100),
  items: z.array(menuItemInputSchema.extend({id: uuidSchema, sourceNote: z.string().nullable(), sourceKey: z.string().nullable().optional().default(null)})).max(1000),
}).superRefine((doc, ctx) => {
  if (new Set(doc.items.map(item => item.id)).size !== doc.items.length || new Set(doc.sections.map(section => section.id)).size !== doc.sections.length) ctx.addIssue({code: "custom", message: "Hay identificadores repetidos."});
  if (new Set(doc.sections.map(section => section.name.toLocaleLowerCase())).size !== doc.sections.length) ctx.addIssue({code: "custom", message: "Hay secciones repetidas."});
  for (const item of doc.items) {
    if (new Set(item.priceOptions.map(option => option.label.toLocaleLowerCase())).size !== item.priceOptions.length) ctx.addIssue({code:"custom",message:`Hay opciones repetidas en ${item.name}.`});
    if ([item.sellPrice,...item.priceOptions.map(option => option.price)].some(value => value !== null && new Decimal(value).gte(100000000))) ctx.addIssue({code:"custom",message:`Precio fuera de rango en ${item.name}.`});
  }
  for (const item of doc.items) if (item.sectionId === null || !doc.sections.some(section => section.id === item.sectionId)) ctx.addIssue({code: "custom", message: `Elegí una sección para ${item.name}.`});
});
export type MenuDocument = z.infer<typeof menuDocumentSchema>;
export interface MenuChange {id: string; name: string; section: string; previousSection: string | null; kind: "new" | "removed" | "changed" | "unchanged"; details: string[]}
const price = (value: string | null): string => value === null ? "Pendiente" : `$${new Decimal(value).toFixed(2)}`;
export function compareMenus(previous: MenuDocument, next: MenuDocument): MenuChange[] {
  const changes: MenuChange[] = next.items.map(item => {
    const old = previous.items.find(row => row.id === item.id);
    const section = next.sections.find(row => row.id === item.sectionId)?.name ?? "Sin sección";
    const previousSection = old === undefined ? null : previous.sections.find(row => row.id === old.sectionId)?.name ?? "Sin sección";
    const details: string[] = [];
    if (old === undefined) { details.push(`Precio: ${price(item.sellPrice)}`, ...item.priceOptions.map(option => `${option.label}: ${price(option.price)}`)); }
    else {
      if (old.name !== item.name) details.push(`Nombre: ${old.name} → ${item.name}`);
      if (price(old.sellPrice) !== price(item.sellPrice)) details.push(`Precio: ${price(old.sellPrice)} → ${price(item.sellPrice)}`);
      if (old.sectionId !== item.sectionId || previousSection !== section) details.push(`Sección: ${previousSection} → ${section}`);
      const labels = new Set([...old.priceOptions.map(option => option.label), ...item.priceOptions.map(option => option.label)]);
      for (const label of labels) {
        const before = old.priceOptions.find(option => option.label === label);
        const after = item.priceOptions.find(option => option.label === label);
        if (before === undefined || after === undefined || price(before.price) !== price(after.price)) details.push(`${label}: ${before === undefined ? "No existía" : price(before.price)} → ${after === undefined ? "Quitada" : price(after.price)}`);
      }
      if (old.priceOptions.length === item.priceOptions.length && old.priceOptions.every(option => item.priceOptions.some(row => row.label === option.label)) && old.priceOptions.some((option,index) => item.priceOptions[index]?.label !== option.label)) details.push("Orden de opciones modificado");
      if (old.description !== item.description) details.push("Descripción modificada");
      if (old.reviewNote !== item.reviewNote) details.push("Nota de revisión modificada");
      if (old.sortOrder !== item.sortOrder) details.push("Orden modificado");
    }
    return {id: item.id, name: item.name, section, previousSection, kind: old === undefined ? "new" : details.length > 0 ? "changed" : "unchanged", details};
  });
  for (const item of previous.items) if (!next.items.some(row => row.id === item.id)) changes.push({id: item.id, name: item.name, section: previous.sections.find(row => row.id === item.sectionId)?.name ?? "Sin sección", previousSection: null, kind: "removed", details: [`Precio anterior: ${price(item.sellPrice)}`, ...item.priceOptions.map(option => `${option.label}: ${price(option.price)}`)]});
  return changes;
}
