import { ChevronRightIcon, PlusIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { ComponentType, ReactElement, ReactNode } from "react";

import { buttonClassName } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { t } from "@/i18n";
import { cn } from "@/lib/cn";

interface ListPageShellProps<T> {
  title: string;
  backHref: string;
  addHref: string;
  items: T[];
  renderItem: (item: T) => ReactNode;
  emptyState: ReactNode;
}

export function ListPageShell<T>({ title, backHref, addHref, items, renderItem, emptyState }: ListPageShellProps<T>): ReactElement {
  return (
    <div className="app-screen">
      <div className="app-page flex flex-col">
      <PageHeader title={title} backHref={backHref} actions={<Link href={addHref} className={buttonClassName({ className: "text-sm" })}><PlusIcon className="h-4 w-4" />{t.common.add}</Link>} />
      <main className="flex-1 py-5">
        {items.length === 0 ? emptyState : <div className="space-y-3">{items.map(renderItem)}</div>}
      </main>
      </div>
    </div>
  );
}

interface EmptyStateProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  ctaHref: string;
  ctaText: string;
}

export function EmptyState({ icon: Icon, title, description, ctaHref, ctaText }: EmptyStateProps): ReactElement {
  return (
    <div className="app-panel flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="app-icon mb-5 flex h-16 w-16 items-center justify-center bg-zinc-200 text-zinc-700">
        <Icon className="h-8 w-8" />
      </div>
      <h2 className="mb-2 text-lg font-semibold text-foreground">{title}</h2>
      <p className="mb-6 text-sm text-muted">{description}</p>
      <Link href={ctaHref} className={buttonClassName({ className: "rounded-full px-6 text-sm" })}>
        {ctaText}
      </Link>
    </div>
  );
}

interface ListPageRowProps {
  href: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  subtitle?: ReactNode;
  subtitleClassName?: string;
}

export function ListPageRow({
  href,
  icon: Icon,
  title,
  subtitle,
  subtitleClassName,
}: ListPageRowProps): ReactElement {
  return (
    <Link href={href} className="app-list-row flex items-center gap-4 rounded-2xl p-4 transition hover:bg-zinc-200 active:scale-[0.99]">
      <div className="app-icon flex h-12 w-12 items-center justify-center bg-zinc-200 text-zinc-700">
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-foreground">{title}</h3>
        {subtitle != null && (
          <p className={cn("text-sm text-muted", subtitleClassName ?? "line-clamp-1")}>
            {subtitle}
          </p>
        )}
      </div>
      <ChevronRightIcon className="h-5 w-5 text-[#64748b]" />
    </Link>
  );
}
