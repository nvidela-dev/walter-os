import { ArrowLeftIcon, ChevronRightIcon, PlusIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { ComponentType, ReactElement, ReactNode } from "react";

import { buttonClassName } from "@/components/ui/button";
import { t } from "@/i18n";

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
    <div className="flex min-h-screen flex-col bg-[#faf8f5]">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-[#faf8f5]/90 px-6 py-5 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Link
            href={backHref}
            aria-label={t.common.back}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f0e8] text-[#8b7355]"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-light text-[#3d3530]">{title}</h1>
        </div>
        <Link href={addHref} className={buttonClassName({ className: "rounded-full text-sm" })}>
          <PlusIcon className="h-4 w-4" />
          {t.common.add}
        </Link>
      </header>
      <main className="flex-1 px-6 py-4">
        {items.length === 0 ? emptyState : <div className="space-y-3">{items.map(renderItem)}</div>}
      </main>
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
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Icon className="mb-4 h-16 w-16 text-[#c4a77d]" />
      <h2 className="mb-2 text-lg font-medium text-[#3d3530]">{title}</h2>
      <p className="mb-6 text-sm text-[#8b7355]">{description}</p>
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
}

export function ListPageRow({ href, icon: Icon, title, subtitle }: ListPageRowProps): ReactElement {
  return (
    <Link href={href} className="flex items-center gap-4 rounded-2xl bg-[#f5f0e8] p-5 transition-colors hover:bg-[#e8e0d4] active:scale-[0.99]">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e8e0d4]">
        <Icon className="h-6 w-6 text-[#8b7355]" />
      </div>
      <div className="flex-1">
        <h3 className="font-medium text-[#3d3530]">{title}</h3>
        {subtitle != null && <p className="text-sm text-[#8b7355] line-clamp-1">{subtitle}</p>}
      </div>
      <ChevronRightIcon className="h-5 w-5 text-[#c4a77d]" />
    </Link>
  );
}
