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
        "ios-header flex min-w-0 items-center gap-3 px-4 py-4",
        actions != null ? "justify-between" : "gap-4"
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Link
          aria-label={t.common.back}
          className="ios-icon-button flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#43636e]"
          href={backHref}
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="truncate text-xl font-semibold tracking-normal text-[#1f2d35]">
          {title}
        </h1>
      </div>
      {actions != null && <div className="shrink-0">{actions}</div>}
    </header>
  );
}
