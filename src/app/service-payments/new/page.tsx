import Link from "next/link";
import { PaymentForm } from "../payment-form";
import { getServices } from "@/app/services/actions";

export default async function NewServicePaymentPage() {
  const services = await getServices();

  return (
    <div className="flex min-h-screen flex-col bg-[#faf8f5]">
      <header className="sticky top-0 z-10 flex items-center gap-4 bg-[#faf8f5]/90 px-6 py-5 backdrop-blur-sm">
        <Link href="/service-payments" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f0e8] text-lg text-[#8b7355]">←</Link>
        <h1 className="text-xl font-light text-[#3d3530]">Nuevo Pago</h1>
      </header>
      <main className="flex-1 px-6 py-4">
        {services.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="mb-4 text-5xl">✨</span>
            <h2 className="mb-2 text-lg font-medium text-[#3d3530]">Sin servicios</h2>
            <p className="mb-6 text-sm text-[#8b7355]">Primero debes crear servicios</p>
            <Link href="/services/new" className="rounded-full bg-[#c4a77d] px-6 py-3 text-sm font-medium text-white shadow-sm">Crear Servicio</Link>
          </div>
        ) : (
          <div className="rounded-2xl bg-[#f5f0e8] p-6">
            <PaymentForm services={services} />
          </div>
        )}
      </main>
    </div>
  );
}
