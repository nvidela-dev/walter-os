import { ArrowLeftIcon, ChevronRightIcon, TruckIcon, WrenchScrewdriverIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { ReactElement } from "react";

import type { ProviderType } from "@/db/schema";
import { t } from "@/i18n";

import { getProviders } from "./actions";

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
    <div className="flex min-h-screen flex-col bg-[#faf8f5]">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-[#faf8f5]/90 px-6 py-5 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f0e8] text-[#8b7355]">
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-light text-[#3d3530]">{t.providers.title}</h1>
        </div>
        <Link href="/providers/new" className="rounded-full bg-[#c4a77d] px-5 py-3 text-sm font-medium text-white shadow-sm active:scale-[0.98]">
          + {t.common.add}
        </Link>
      </header>

      <nav className="px-6 pb-2">
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#f5f0e8] p-1">
          {TABS.map((tab) => {
            const isActive = tab.value === activeType;
            return (
              <Link
                key={tab.value}
                href={tab.value === "producto" ? "/providers" : `/providers?type=${tab.value}`}
                className={`rounded-xl py-2.5 text-center text-sm font-medium transition-colors ${
                  isActive ? "bg-white text-[#3d3530] shadow-sm" : "text-[#8b7355]"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <main className="flex-1 px-6 py-4">
        {providers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Icon className="mb-4 h-16 w-16 text-[#c4a77d]" />
            <h2 className="mb-2 text-lg font-medium text-[#3d3530]">{emptyTitle}</h2>
            <p className="mb-6 text-sm text-[#8b7355]">{emptyDescription}</p>
            <Link href="/providers/new" className="rounded-full bg-[#c4a77d] px-6 py-3 text-sm font-medium text-white shadow-sm">{t.providers.addCta}</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {providers.map((provider) => (
              <Link key={provider.id} href={`/providers/${provider.id}`}
                className="flex items-center gap-4 rounded-2xl bg-[#f5f0e8] p-5 transition-colors hover:bg-[#e8e0d4] active:scale-[0.99]">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${provider.productCount > 0 ? 'bg-amber-100' : 'bg-[#e8e0d4]'}`}>
                  <Icon className={`h-6 w-6 ${provider.productCount > 0 ? 'text-amber-600' : 'text-[#8b7355]'}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-[#3d3530]">{provider.name}</h3>
                  {provider.description != null && (
                    <p className="text-sm text-[#8b7355]">{provider.description}</p>
                  )}
                  {Number(provider.debt) > 0 && (
                    <p className="text-sm text-[#a68b5b]">{t.providers.debtLabel(provider.debt)}</p>
                  )}
                </div>
                {provider.days != null && (
                  <div className="flex gap-1">
                    {provider.days.split(",").map((day) => (
                      <span key={day} className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-medium text-amber-700">
                        {day}
                      </span>
                    ))}
                  </div>
                )}
                <ChevronRightIcon className="h-5 w-5 text-[#c4a77d]" />
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
