import { ArrowLeftIcon, ChevronRightIcon, PlusIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { ComponentType, ReactElement, ReactNode } from "react";

import { buttonClassName } from "@/components/ui/button";
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
    <div className="ios-screen">
      <div className="ios-page flex flex-col">
      <header className="ios-header flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-4">
          <Link
            href={backHref}
            aria-label={t.common.back}
            className="ios-icon-button flex h-10 w-10 items-center justify-center rounded-full text-[#43636e]"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-semibold text-[#1f2d35]">{title}</h1>
        </div>
        <Link href={addHref} className={buttonClassName({ className: "rounded-full text-sm" })}>
          <PlusIcon className="h-4 w-4" />
          {t.common.add}
        </Link>
      </header>
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
    <div className="ios-panel flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="ios-icon mb-5 flex h-16 w-16 items-center justify-center bg-[#2388d1] text-white">
        <Icon className="h-8 w-8" />
      </div>
      <h2 className="mb-2 text-lg font-semibold text-[#1f2d35]">{title}</h2>
      <p className="mb-6 text-sm text-[#526b74]">{description}</p>
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
    <Link href={href} className="ios-list-row flex items-center gap-4 rounded-[1.4rem] p-4 transition hover:bg-white/65 active:scale-[0.99]">
      <div className="ios-icon flex h-12 w-12 items-center justify-center bg-[#5aa6dd] text-white">
        <Icon className="h-6 w-6" />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-[#1f2d35]">{title}</h3>
        {subtitle != null && (
          <p className={cn("text-sm text-[#526b74]", subtitleClassName ?? "line-clamp-1")}>
            {subtitle}
          </p>
        )}
      </div>
      <ChevronRightIcon className="h-5 w-5 text-[#799099]" />
    </Link>
  );
}
