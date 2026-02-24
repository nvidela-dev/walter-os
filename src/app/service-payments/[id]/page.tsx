import Link from "next/link";
import { notFound } from "next/navigation";
import { getServicePayment, deleteServicePayment } from "../actions";
import { getServices } from "@/app/services/actions";
import { PaymentForm } from "../payment-form";
import { DeleteButton } from "@/app/components/delete-button";

export default async function ServicePaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [payment, services] = await Promise.all([
    getServicePayment(id),
    getServices(),
  ]);

  if (!payment) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-[#faf8f5]">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-[#faf8f5]/90 px-6 py-5 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Link href="/service-payments" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f0e8] text-lg text-[#8b7355]">←</Link>
          <h1 className="text-xl font-light text-[#3d3530]">{payment.servicioNombre}</h1>
        </div>
        <DeleteButton id={payment.id} name={`pago de ${payment.servicioNombre}`} deleteAction={deleteServicePayment} redirectTo="/service-payments" />
      </header>
      <main className="flex-1 px-6 py-4">
        <div className="rounded-2xl bg-[#f5f0e8] p-6">
          <PaymentForm services={services} payment={payment} />
        </div>
      </main>
    </div>
  );
}
