import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { ReactElement, ReactNode } from "react";

import { t } from "@/i18n";
import { cn } from "@/lib/cn";

export function PageHeader({
  actions,
  backHref,
  backLabel = t.common.back,
  title,
  titleHref,
  titleAs = "h1",
  className,
}: {
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
  title: string;
  titleHref?: string;
  titleAs?: "h1" | "div";
  className?: string;
}): ReactElement {
  const Title = titleAs;
  return (
    <header
      className={cn(
        "app-header flex min-w-0 items-center gap-3",
        actions != null ? "justify-between" : "gap-4",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {backHref !== undefined && <Link
          aria-label={backLabel}
          className="app-icon-button flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted"
          href={backHref}
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>}
        <Title className="app-header-title break-words text-foreground">
          {titleHref === undefined ? title : <Link href={titleHref}>{title}</Link>}
        </Title>
      </div>
      {actions != null && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
