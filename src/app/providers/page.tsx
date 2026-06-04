import Link from "next/link";
import { getProviders } from "./actions";
import { TruckIcon, ArrowLeftIcon, ChevronRightIcon, WrenchScrewdriverIcon } from "@heroicons/react/24/outline";
import type { ProveedorTipo } from "@/db/schema";

export const dynamic = "force-dynamic";

const TABS: { value: ProveedorTipo; label: string }[] = [
  { value: "producto", label: "Productos" },
  { value: "servicio", label: "Servicios" },
];

function isProveedorTipo(value: string | undefined): value is ProveedorTipo {
  return value === "producto" || value === "servicio";
}

interface ProvidersPageProps {
  searchParams: Promise<{ tipo?: string }>;
}

export default async function ProvidersPage({ searchParams }: ProvidersPageProps) {
  const { tipo: tipoParam } = await searchParams;
  const activeTipo: ProveedorTipo = isProveedorTipo(tipoParam) ? tipoParam : "producto";
  const allProviders = await getProviders();
  const providers = allProviders.filter((p) => p.tipo === activeTipo);

  const isService = activeTipo === "servicio";
  const Icon = isService ? WrenchScrewdriverIcon : TruckIcon;
  const emptyTitle = isService ? "Sin proveedores de servicios" : "Sin proveedores";
  const emptyDescription = isService ? "Agrega tu primer proveedor de servicios" : "Agrega tu primer proveedor";

  return (
    <div className="flex min-h-screen flex-col bg-[#faf8f5]">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-[#faf8f5]/90 px-6 py-5 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f0e8] text-[#8b7355]">
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-light text-[#3d3530]">Proveedores</h1>
        </div>
        <Link href="/providers/new" className="rounded-full bg-[#c4a77d] px-5 py-3 text-sm font-medium text-white shadow-sm active:scale-[0.98]">
          + Agregar
        </Link>
      </header>

      <nav className="px-6 pb-2">
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#f5f0e8] p-1">
          {TABS.map((tab) => {
            const isActive = tab.value === activeTipo;
            return (
              <Link
                key={tab.value}
                href={tab.value === "producto" ? "/providers" : `/providers?tipo=${tab.value}`}
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
            <Link href="/providers/new" className="rounded-full bg-[#c4a77d] px-6 py-3 text-sm font-medium text-white shadow-sm">Agregar Proveedor</Link>
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
                  <h3 className="font-medium text-[#3d3530]">{provider.nombre}</h3>
                  {provider.descripcion && (
                    <p className="text-sm text-[#8b7355]">{provider.descripcion}</p>
                  )}
                  {Number(provider.deuda) > 0 && (
                    <p className="text-sm text-[#a68b5b]">Deuda: ${provider.deuda}</p>
                  )}
                </div>
                {provider.dias && (
                  <div className="flex gap-1">
                    {provider.dias.split(",").map((day) => (
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
