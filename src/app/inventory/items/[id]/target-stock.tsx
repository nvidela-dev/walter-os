import Link from "next/link";
import type { ReactElement } from "react";

import { t } from "@/i18n";
import { getCurrentGroup } from "@/lib/auth/access";
import { inventoryDate } from "@/lib/inventory/comparison";
import { getInventoryTargetProduct } from "@/lib/queries/inventory-targets";

import { TargetForm } from "./target-form";

export async function TargetStock({ productId }: { productId: string }): Promise<ReactElement | null> {
  const [product, group] = await Promise.all([getInventoryTargetProduct(productId), getCurrentGroup()]);
  if (product === null) return null;
  const target = product.target;
  return <section className="app-card space-y-3 rounded-2xl p-5">
    <h2 className="font-semibold">{t.inventoryTargets.title}</h2>
    <p className="text-sm text-muted">{t.inventoryTargets.scope}</p>
    <p>{target === null ? t.inventoryTargets.missing : `${target.quantity} ${target.unit}`}</p>
    {target !== null && <p className="text-xs text-muted">{inventoryDate(target.recordedAt.toISOString())}</p>}
    {target !== null && target.unit !== product.unit && <p className="text-sm">{t.inventoryTargets.unitChanged}</p>}
    {group === "admin" ? <TargetForm key={target?.id ?? "new"} productId={product.id} unit={product.unit} quantity={target?.unit === product.unit ? target.quantity : null} /> : <p className="text-sm text-muted">{t.inventoryTargets.adminOnly}</p>}
    <Link href={`/inventory/items/${product.id}/targets`} className="block text-sm underline">{t.inventoryTargets.history}</Link>
  </section>;
}
