import type { ReactElement } from "react";

import { t } from "@/i18n";
import type { InventoryProgressCounts } from "@/lib/inventory/progress";

export function InventoryProgress({ counted, total, compact = false }: InventoryProgressCounts & { compact?: boolean }): ReactElement {
  if (compact) return <p className="inline-flex rounded-md bg-zinc-200/60 px-2 py-1 text-xs font-medium text-muted">{total === 0 ? t.inventory.emptyFridge : t.inventory.compactProgress(counted, total)}</p>;
  return <p className="text-sm text-muted">{total === 0 ? t.inventory.noItems : counted === total ? t.inventory.fullyCounted(total) : t.inventory.countProgress(counted, total)}</p>;
}
