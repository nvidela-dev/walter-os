import Link from "next/link";
import type { ReactElement, ReactNode } from "react";

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
          <Link href={backHref} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f0e8] text-lg text-[#8b7355]">←</Link>
          <h1 className="text-xl font-light text-[#3d3530]">{title}</h1>
        </div>
        <Link href={addHref} className="rounded-full bg-[#c4a77d] px-5 py-3 text-sm font-medium text-white shadow-sm active:scale-[0.98]">+ {t.common.add}</Link>
      </header>
      <main className="flex-1 px-6 py-4">
        {items.length === 0 ? emptyState : <div className="space-y-3">{items.map(renderItem)}</div>}
      </main>
    </div>
  );
}

interface EmptyStateProps {
  emoji: string;
  title: string;
  description: string;
  ctaHref: string;
  ctaText: string;
}

export function EmptyState({ emoji, title, description, ctaHref, ctaText }: EmptyStateProps): ReactElement {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <span className="mb-4 text-5xl">{emoji}</span>
      <h2 className="mb-2 text-lg font-medium text-[#3d3530]">{title}</h2>
      <p className="mb-6 text-sm text-[#8b7355]">{description}</p>
      <Link href={ctaHref} className="rounded-full bg-[#c4a77d] px-6 py-3 text-sm font-medium text-white shadow-sm">{ctaText}</Link>
    </div>
  );
}

interface ListPageRowProps {
  href: string;
  emoji: string;
  title: string;
  subtitle?: ReactNode;
}

export function ListPageRow({ href, emoji, title, subtitle }: ListPageRowProps): ReactElement {
  return (
    <Link href={href} className="flex items-center gap-4 rounded-2xl bg-[#f5f0e8] p-5 transition-colors hover:bg-[#e8e0d4] active:scale-[0.99]">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e8e0d4] text-xl">{emoji}</div>
      <div className="flex-1">
        <h3 className="font-medium text-[#3d3530]">{title}</h3>
        {subtitle != null && <p className="text-sm text-[#8b7355] line-clamp-1">{subtitle}</p>}
      </div>
      <span className="text-[#c4a77d]">→</span>
    </Link>
  );
}
