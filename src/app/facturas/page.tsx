import Link from "next/link";
import { ArrowLeftIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import { getFacturas } from "./actions";
import { FacturaList } from "./factura-list";

export default async function FacturasPage() {
  const facturas = await getFacturas();

  return (
    <div className="flex min-h-screen flex-col bg-[#faf8f5]">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-[#faf8f5]/90 px-6 py-5 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f0e8] text-[#8b7355]"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-light text-[#3d3530]">Facturas</h1>
        </div>
        <Link
          href="/facturas/new"
          className="rounded-full bg-[#c4a77d] px-5 py-3 text-sm font-medium text-white shadow-sm active:scale-[0.98]"
        >
          + Nueva
        </Link>
      </header>

      <main className="flex-1 px-6 py-4">
        {facturas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <DocumentTextIcon className="mb-4 h-16 w-16 text-[#c4a77d]" />
            <h2 className="mb-2 text-lg font-medium text-[#3d3530]">Sin facturas</h2>
            <p className="mb-6 text-sm text-[#8b7355]">Carga tu primera factura</p>
            <Link
              href="/facturas/new"
              className="rounded-full bg-[#c4a77d] px-6 py-3 text-sm font-medium text-white shadow-sm"
            >
              Nueva Factura
            </Link>
          </div>
        ) : (
          <FacturaList facturas={facturas} />
        )}
      </main>
    </div>
  );
}
