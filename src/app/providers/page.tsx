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
    <div className="ios-screen">
      <div className="ios-page flex flex-col">
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
        <div className="ios-glass grid grid-cols-2 gap-1 rounded-full p-1">
          {TABS.map((tab) => {
            const isActive = tab.value === activeType;
            return (
              <Link
                key={tab.value}
                href={tab.value === "producto" ? "/providers" : `/providers?type=${tab.value}`}
                className={`rounded-full py-2.5 text-center text-sm font-semibold transition ${
                  isActive ? "bg-white text-[#1f2d35] shadow-sm" : "text-[#526b74]"
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
          <div className="ios-panel flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="ios-icon mb-5 flex h-16 w-16 items-center justify-center bg-[#f08f55] text-white">
              <Icon className="h-8 w-8" />
            </div>
            <h2 className="mb-2 text-lg font-semibold text-[#1f2d35]">{emptyTitle}</h2>
            <p className="mb-6 text-sm text-[#526b74]">{emptyDescription}</p>
            <Link href="/providers/new" className={buttonClassName({ className: "rounded-full px-6 text-sm" })}>{t.providers.addCta}</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {providers.map((provider) => (
              <Link key={provider.id} href={`/providers/${provider.id}`}
                className="ios-list-row flex items-center gap-4 rounded-[1.4rem] p-4 transition hover:bg-white/65 active:scale-[0.99]">
                <div className={`ios-icon flex h-12 w-12 items-center justify-center text-white ${provider.productCount > 0 ? "bg-[#f08f55]" : "bg-[#5aa6dd]"}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[#1f2d35]">{provider.name}</h3>
                  {provider.description != null && (
                    <p className="text-sm text-[#526b74]">{provider.description}</p>
                  )}
                  {Number(provider.debt) > 0 && (
                    <p className="text-sm font-medium text-[#c56f4e]">{t.providers.debtLabel(provider.debt)}</p>
                  )}
                </div>
                {provider.days != null && (
                  <div className="flex gap-1">
                    {provider.days.split(",").map((day) => (
                      <span key={day} className="flex h-6 w-6 items-center justify-center rounded-full bg-white/60 text-xs font-semibold text-[#526b74]">
                        {day}
                      </span>
                    ))}
                  </div>
                )}
                <ChevronRightIcon className="h-5 w-5 text-[#799099]" />
              </Link>
            ))}
          </div>
        )}
      </main>
      </div>
    </div>
  );
}
