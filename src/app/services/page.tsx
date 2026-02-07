import Link from "next/link";
import { getServices } from "./actions";

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <div className="flex min-h-screen flex-col bg-[#faf8f5]">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-[#faf8f5]/90 px-6 py-5 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f0e8] text-lg text-[#8b7355]">←</Link>
          <h1 className="text-xl font-light text-[#3d3530]">Servicios</h1>
        </div>
        <Link href="/services/new" className="rounded-full bg-[#c4a77d] px-5 py-3 text-sm font-medium text-white shadow-sm active:scale-[0.98]">+ Agregar</Link>
      </header>

      <main className="flex-1 px-6 py-4">
        {services.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="mb-4 text-5xl">✨</span>
            <h2 className="mb-2 text-lg font-medium text-[#3d3530]">Sin servicios</h2>
            <p className="mb-6 text-sm text-[#8b7355]">Agrega luz, agua, gas...</p>
            <Link href="/services/new" className="rounded-full bg-[#c4a77d] px-6 py-3 text-sm font-medium text-white shadow-sm">Agregar Servicio</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {services.map((service) => (
              <Link key={service.id} href={`/services/${service.id}`}
                className="flex items-center gap-4 rounded-2xl bg-[#f5f0e8] p-5 transition-colors hover:bg-[#e8e0d4] active:scale-[0.99]">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e8e0d4] text-xl">✨</div>
                <div className="flex-1">
                  <h3 className="font-medium text-[#3d3530]">{service.nombre}</h3>
                  <p className="text-sm text-[#8b7355]">${service.montoFijo} / {service.frecuencia}</p>
                </div>
                <span className="text-[#c4a77d]">→</span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
