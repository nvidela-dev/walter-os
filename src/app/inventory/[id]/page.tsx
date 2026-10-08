import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/i18n";
import { getFridge, getFridgeRunInventory, searchInventoryProducts } from "@/lib/queries/inventory";
import { getUnits } from "@/lib/queries/units";

import { InventoryList } from "../list/list";
import { CatalogueForm } from "./catalogue-form";


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
    <div><h1 className="app-title mt-3">{t.inventory.fridge(fridge.number)}</h1><p className="text-muted">{fridge.name}</p></div>
    <details className="app-card rounded-2xl p-4" open={q.length > 0}>
      <summary className="cursor-pointer font-medium">{t.inventory.search}</summary>
      <form action={`/inventory/${id}`} className="my-4 flex gap-2">
        <Input name="q" aria-label={t.inventory.search} placeholder={t.inventory.search} defaultValue={q} maxLength={200} />
        <Button type="submit">{t.inventory.searchAction}</Button>
      </form>
      <CatalogueForm fridgeId={id} matches={available} units={units} query={q} />
    </details>
    <InventoryList groups={[{ id: fridge.id, number: fridge.number, name: fridge.name, commentary: fridge.commentary, rows }]} />
  </main>;
}
