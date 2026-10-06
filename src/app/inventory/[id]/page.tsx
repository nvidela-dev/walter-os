import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/i18n";
import { getFridge, getFridgeRunInventory, searchInventoryProducts } from "@/lib/queries/inventory";
import { getUnits } from "@/lib/queries/units";

import { FridgeDetails } from "../fridge-details";
import { CatalogueForm } from "./catalogue-form";
import { CountForm } from "./count-form";

export const dynamic = "force-dynamic";

export default async function FridgePage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string | string[] }>;
}): Promise<ReactElement> {
  const { id } = await params;
  const fridge = await getFridge(id);
  if (fridge === null) notFound();
  const { q: searchTerm } = await searchParams;
  const q = typeof searchTerm === "string" ? searchTerm : "";
  const [rows, matches, units] = await Promise.all([getFridgeRunInventory(id), searchInventoryProducts(q), getUnits()]);
  const available = matches.filter((product) => !rows.some((row) => row.id === product.id));
  return <main className="space-y-5">
    <Link href="/inventory" className="text-sm text-warm-dark">← {t.inventory.fridges}</Link>
    <div><h1 className="mt-3 text-3xl font-semibold">{t.inventory.fridge(fridge.number)}</h1><p className="text-muted">{fridge.name}</p></div>
    <FridgeDetails fridge={fridge} />
    <details className="ios-glass rounded-2xl p-4" open={q.length > 0}>
      <summary className="cursor-pointer font-medium">{t.inventory.search}</summary>
      <form action={`/inventory/${id}`} className="my-4 flex gap-2">
        <Input name="q" aria-label={t.inventory.search} placeholder={t.inventory.search} defaultValue={q} maxLength={200} />
        <Button type="submit">{t.inventory.searchAction}</Button>
      </form>
      <CatalogueForm fridgeId={id} matches={available} units={units} query={q} />
    </details>
    <CountForm fridgeId={id} rows={rows} />
  </main>;
}
