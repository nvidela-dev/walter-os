import "./console.css";

import Link from "next/link";
import type { ReactElement } from "react";

import { getProductMatching } from "@/lib/queries/product-matching";

import { MatchingReview } from "./matching-review";

export const dynamic = "force-dynamic";
export default async function ProductMatchingPage(): Promise<ReactElement> {
  const data = await getProductMatching();
  return <main className="matching-page"><header><Link href="/">← inicio</Link><h1>walter / backoffice / equivalencias</h1></header><MatchingReview {...data} /></main>;
}
