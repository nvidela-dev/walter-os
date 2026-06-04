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
        "sticky top-0 z-10 flex items-center bg-[#faf8f5]/90 px-6 py-5 backdrop-blur-sm",
        actions != null ? "justify-between" : "gap-4"
      )}
    >
      <div className="flex items-center gap-4">
        <Link
          aria-label={t.common.back}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f0e8] text-[#8b7355]"
          href={backHref}
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-light text-[#3d3530]">{title}</h1>
      </div>
      {actions}
    </header>
  );
}
