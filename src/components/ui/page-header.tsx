import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { ReactElement, ReactNode } from "react";

import { t } from "@/i18n";
import { cn } from "@/lib/cn";

export function PageHeader({
  actions,
  backHref,
  title,
}: {
  actions?: ReactNode;
  backHref: string;
  title: string;
}): ReactElement {
  return (
    <header
      className={cn(
        "app-header flex min-w-0 items-center gap-3 py-4",
        actions != null ? "justify-between" : "gap-4"
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Link
          aria-label={t.common.back}
          className="app-icon-button flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted"
          href={backHref}
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="break-words text-xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
      </div>
      {actions != null && <div className="shrink-0">{actions}</div>}
    </header>
  );
}
