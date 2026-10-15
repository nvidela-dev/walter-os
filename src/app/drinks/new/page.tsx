import type { ReactElement } from "react";

import { drinkCategory } from "@/lib/drinks/categories";
import { getDrinkCreationOptions } from "@/lib/queries/drinks";

import { AddDrinkForm } from "./add-drink-form";

export const dynamic = "force-dynamic";

export default async function NewDrinkPage({ searchParams }: { searchParams: Promise<{ category?: string }> }): Promise<ReactElement> {
  const category = drinkCategory((await searchParams).category);
  const options = await getDrinkCreationOptions();
  return <main className="space-y-4 py-4">
    <h1 className="text-xl font-bold">Agregar bebida</h1>
    <p className="text-sm text-muted">Agregá una bebida y el lugar donde se cuenta. No hace falta indicar cantidades ni proveedor.</p>
    <AddDrinkForm category={category} units={options.units} locations={options.locations} />
  </main>;
}
