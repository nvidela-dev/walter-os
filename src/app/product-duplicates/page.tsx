import "../product-matching/console.css";

import Link from "next/link";
import type { ReactElement } from "react";

import { getDuplicateProducts } from "@/lib/queries/product-duplicates";
import { getProductMatching } from "@/lib/queries/product-matching";

import { DuplicateReview } from "./duplicate-review";

export const dynamic = "force-dynamic";
export default async function ProductDuplicatesPage(): Promise<ReactElement> {
  const [products, matching] = await Promise.all([getDuplicateProducts(), getProductMatching()]);
  return <main className="matching-page"><header><Link href="/dashboard">← menú</Link><h1>Revisar duplicados</h1><Link href="/product-matching">Unir nombres</Link></header><DuplicateReview products={products} decisions={matching.decisions} /></main>;
}
