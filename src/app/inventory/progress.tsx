import type { ReactElement } from "react";

import { t } from "@/i18n";
import type { InventoryProgressCounts } from "@/lib/inventory/progress";

export function InventoryProgress({ counted, total }: InventoryProgressCounts): ReactElement {
  return <p className="text-sm text-muted">{total === 0 ? t.inventory.noItems : counted === total ? t.inventory.fullyCounted(total) : t.inventory.countProgress(counted, total)}</p>;
}
