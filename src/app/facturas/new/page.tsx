import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { getFacturaFormData } from "../actions";
import { getUnidades } from "@/app/providers/actions";
import { FacturaForm } from "./factura-form";

export const dynamic = "force-dynamic";

export default async function NuevaFacturaPage() {
  const [proveedores, unidades] = await Promise.all([
    getFacturaFormData(),
    getUnidades(),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-[#faf8f5]">
      <header className="sticky top-0 z-10 flex items-center gap-4 bg-[#faf8f5]/90 px-6 py-5 backdrop-blur-sm">
        <Link
          href="/"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f0e8] text-[#8b7355]"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-light text-[#3d3530]">Nueva Factura</h1>
      </header>

      <main className="flex-1 px-6 py-4 pb-24">
        {proveedores.length === 0 ? (
          <div className="rounded-2xl bg-[#f5f0e8] p-6 text-center">
            <p className="mb-2 text-[#3d3530]">No hay proveedores.</p>
            <p className="text-sm text-[#8b7355]">
              Agrega un proveedor para empezar a registrar facturas.
            </p>
            <Link
              href="/providers"
              className="mt-4 inline-block rounded-full bg-[#c4a77d] px-5 py-3 text-sm font-medium text-white"
            >
              Ir a Proveedores
            </Link>
          </div>
        ) : (
          <FacturaForm proveedores={proveedores} unidades={unidades} />
        )}
      </main>
    </div>
  );
}
