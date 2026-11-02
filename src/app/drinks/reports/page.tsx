import type { ReactElement } from "react";

import { OrderReport } from "@/components/order-report";
import { buttonClassName } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { drinkCategory } from "@/lib/drinks/categories";
import { getDrinkDocuments } from "@/lib/queries/drink-documents";
import { getDrinkPurchases } from "@/lib/queries/drink-purchases";

export const dynamic = "force-dynamic";
export default async function DrinkReports({ searchParams }: { searchParams: Promise<{category?: string; document?: string}> }): Promise<ReactElement> {
  const params = await searchParams;
  const category = drinkCategory(params.category);
  const { documents } = await getDrinkDocuments(category);
  const selected = documents.find(doc => doc.id === params.document) ?? documents[0];
  const report = selected ? await getDrinkPurchases(selected.id) : null;
  return <main className="space-y-4 py-4"><h1 className="text-xl font-bold">Crear pedidos · {category}</h1>
    <form className="space-y-2"><input type="hidden" name="category" value={category} /><label className="block text-sm">Inventario de referencia<Select name="document" defaultValue={selected?.id}>{documents.map(doc => <option key={doc.id} value={doc.id}>{doc.date} · {doc.items.filter(item => item.quantity !== null).length}/{doc.items.length} revisados</option>)}</Select></label><button className={buttonClassName({ variant: "secondary" })} disabled={documents.length === 0}>Usar este inventario</button></form>
    {report ? <OrderReport key={selected?.id} products={report.products} label={category} date={report.day} /> : <p>Primero creá y completá un inventario de {category}.</p>}
  </main>;
}
