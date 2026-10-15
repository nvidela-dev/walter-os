import type { ReactElement } from "react";

import { drinkCategory } from "@/lib/drinks/categories";
import { drinkDocumentHref } from "@/lib/drinks/documents";
import { getDrinkDocument } from "@/lib/queries/drink-documents";
import { getDrinkCreationOptions } from "@/lib/queries/drinks";

import { AddDrinkForm } from "./add-drink-form";

export const dynamic = "force-dynamic";

export default async function NewDrinkPage({ searchParams }: { searchParams: Promise<{ category?: string; document?: string }> }): Promise<ReactElement> {
  const params = await searchParams;
  const category = drinkCategory(params.category);
  const document = params.document === undefined ? null : await getDrinkDocument(params.document);
  const returnHref = document?.canEdit === true && document.document.category === category ? drinkDocumentHref(document.document.id,category,document.document.date,true) : undefined;
  const options = await getDrinkCreationOptions();
  return <main className="space-y-4 py-4">
    <h1 className="text-xl font-bold">Agregar bebida</h1>
    <p className="text-sm text-muted">Agregá una bebida y el lugar donde se cuenta. No hace falta indicar cantidades ni proveedor.</p>
    <AddDrinkForm returnHref={returnHref} category={category} units={options.units} locations={options.locations} />
  </main>;
}
