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
        "ios-header flex items-center px-4 py-4",
        actions != null ? "justify-between" : "gap-4"
      )}
    >
      <div className="flex items-center gap-4">
        <Link
          aria-label={t.common.back}
          className="ios-icon-button flex h-10 w-10 items-center justify-center rounded-full text-[#43636e]"
          href={backHref}
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-semibold tracking-normal text-[#1f2d35]">{title}</h1>
      </div>
      {actions}
    </header>
  );
}
