import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";

import { t } from "@/i18n";
import { inventoryDate } from "@/lib/inventory/comparison";
import { getInventoryTargetHistory, getInventoryTargetProduct } from "@/lib/queries/inventory-targets";

export const dynamic = "force-dynamic";

export default async function TargetHistoryPage({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ page?: string }>;
}): Promise<ReactElement> {
  const { id } = await params;
  const { page: requestedPage } = await searchParams;
  const page = Number(requestedPage ?? "1");
  if (!Number.isSafeInteger(page) || page < 1 || page > 1000000) notFound();
  const product = await getInventoryTargetProduct(id);
  if (product === null) notFound();
  const { revisions, hasNext } = await getInventoryTargetHistory(id, page);
  return <main className="space-y-5">
    <Link href={`/inventory/items/${id}`} className="text-sm underline">{t.inventoryTargets.back}</Link>
    <h1 className="text-3xl font-semibold">{t.inventoryTargets.history}</h1>
    <p>{product.name}</p>
    <p className="text-sm text-muted">{t.inventoryTargets.historyHint}</p>
    {revisions.length === 0 && <p>{t.inventoryTargets.missing}</p>}
    <ul className="ios-glass divide-y rounded-2xl p-4">{revisions.map((revision) => <li className="space-y-1 py-3" key={revision.id}>
      <p>{revision.quantity} {revision.unit}{revision.id === product.target?.id && <span className="ml-2 text-sm">{t.inventoryTargets.active}</span>}</p>
      <p className="text-xs text-muted">{inventoryDate(revision.recordedAt.toISOString())}</p>
    </li>)}</ul>
    <nav className="flex justify-between text-sm underline" aria-label={t.inventoryTargets.history}>
      {page > 1 ? <Link href={`?page=${page - 1}`}>{t.inventoryTargets.newer}</Link> : <span />}
      {hasNext && <Link href={`?page=${page + 1}`}>{t.inventoryTargets.older}</Link>}
    </nav>
  </main>;
}
