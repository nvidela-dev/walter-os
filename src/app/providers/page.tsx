import { ChevronRightIcon, PlusIcon, TruckIcon, WrenchScrewdriverIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { ReactElement } from "react";

import { buttonClassName } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { t } from "@/i18n";
import { getProviders } from "@/lib/queries/providers";
import type { ProviderType } from "@/lib/types/providers";

export const dynamic = "force-dynamic";

const TABS: { value: ProviderType; label: string }[] = [
  { value: "producto", label: t.providers.types.producto },
  { value: "servicio", label: t.providers.types.servicio },
];

function isProviderType(value: string | undefined): value is ProviderType {
  return value === "producto" || value === "servicio";
}

interface ProvidersPageProps {
  searchParams: Promise<{ type?: string }>;
}

export default async function ProvidersPage({
  searchParams,
}: ProvidersPageProps): Promise<ReactElement> {
  const { type: typeParam } = await searchParams;
  const activeType: ProviderType = isProviderType(typeParam) ? typeParam : "producto";
  const allProviders = await getProviders();
  const providers = allProviders.filter((p) => p.type === activeType);

  const isService = activeType === "servicio";
  const Icon = isService ? WrenchScrewdriverIcon : TruckIcon;
  const emptyTitle = isService ? t.providers.emptyTitleService : t.providers.emptyTitle;
  const emptyDescription = isService
    ? t.providers.emptyDescriptionService
    : t.providers.emptyDescription;

  return (
    <div className="app-screen">
      <div className="app-page flex flex-col">
      <PageHeader
        backHref="/"
        title={t.providers.title}
        actions={
          <Link
            href="/providers/new"
            className={buttonClassName({ className: "rounded-full px-4 text-sm" })}
          >
            <PlusIcon className="h-4 w-4" />
            {t.common.add}
          </Link>
        }
      />

      <nav className="pb-2 pt-5">
        <div className="app-card grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
          {TABS.map((tab) => {
            const isActive = tab.value === activeType;
            return (
              <Link
                key={tab.value}
                href={tab.value === "producto" ? "/providers" : `/providers?type=${tab.value}`}
                className={`rounded-lg py-2.5 text-center text-sm font-semibold transition ${
                  isActive ? "bg-white text-[#0f172a] shadow-sm" : "text-[#475569]"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <main className="flex-1 py-4">
        {providers.length === 0 ? (
          <div className="app-panel flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="app-icon mb-5 flex h-16 w-16 items-center justify-center bg-zinc-200 text-zinc-700">
              <Icon className="h-8 w-8" />
            </div>
            <h2 className="mb-2 text-lg font-semibold text-[#0f172a]">{emptyTitle}</h2>
            <p className="mb-6 text-sm text-[#475569]">{emptyDescription}</p>
            <Link href="/providers/new" className={buttonClassName({ className: "rounded-full px-6 text-sm" })}>{t.providers.addCta}</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {providers.map((provider) => (
              <Link key={provider.id} href={`/providers/${provider.id}`}
                className="app-list-row flex items-center gap-4 rounded-2xl p-4 transition hover:bg-zinc-200 active:scale-[0.99]">
                <div className="app-icon flex h-12 w-12 items-center justify-center bg-zinc-200 text-zinc-700">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-[#0f172a]">{provider.name}</h3>
                  {provider.description != null && (
                    <p className="text-sm text-[#475569]">{provider.description}</p>
                  )}
                  {Number(provider.debt) > 0 && (
                    <p className="text-sm font-medium text-[#b45309]">{t.providers.debtLabel(provider.debt)}</p>
                  )}
                </div>
                {provider.days != null && (
                  <div className="flex shrink-0 flex-wrap justify-end gap-1">
                    {provider.days.split(",").map((day) => (
                      <span key={day} className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-semibold text-[#475569]">
                        {day}
                      </span>
                    ))}
                  </div>
                )}
                <ChevronRightIcon className="h-5 w-5 text-[#64748b]" />
              </Link>
            ))}
          </div>
        )}
      </main>
      </div>
    </div>
  );
}
