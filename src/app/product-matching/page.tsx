import type { ReactElement } from "react";

import { PageHeader } from "@/components/ui/page-header";
import { getProductMatching } from "@/lib/queries/product-matching";

import { MatchingReview } from "./matching-review";

export const dynamic = "force-dynamic";
export default async function ProductMatchingPage(): Promise<ReactElement> {
  const data = await getProductMatching();
  return <div className="app-page max-w-5xl"><PageHeader title="Unir nombres" backHref="/" backLabel="Inicio" />
    <p className="mb-6 text-slate-600">Revisá qué producto del catálogo corresponde a cada nombre del inventario. Los nombres iguales se vinculan automáticamente y podés corregirlos. Las otras sugerencias esperan tu confirmación.</p>
    <MatchingReview {...data} />
  </div>;
}
