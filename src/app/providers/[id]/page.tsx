import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";

import { DeleteButton } from "@/components/delete-button";

import { deleteProvider, getProviderWithProducts, getUnits } from "../actions";
import { ProviderForm } from "../provider-form";
import { AddProductForm } from "./add-product-form";
import { DebtForm } from "./debt-form";
import { ProductList } from "./product-list";

export const dynamic = "force-dynamic";

interface ProviderPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProviderPage({
  params,
}: ProviderPageProps): Promise<ReactElement> {
  const { id } = await params;
  const [provider, units] = await Promise.all([
    getProviderWithProducts(id),
    getUnits(),
  ]);

  if (!provider) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#faf8f5]">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-[#faf8f5]/90 px-6 py-5 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Link href="/providers" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f0e8] text-[#8b7355]">
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-light text-[#3d3530]">{provider.name}</h1>
        </div>
        <DeleteButton id={provider.id} name={provider.name} deleteAction={deleteProvider} redirectTo="/providers" />
      </header>

      <main className="flex-1 space-y-6 px-6 py-4">
        <section className="rounded-2xl bg-[#f5f0e8] p-6">
          <ProviderForm provider={provider} />
        </section>

        {provider.type === "producto" && (
          <section className="rounded-2xl bg-[#f5f0e8] p-6">
            <ProductList products={provider.products} providerId={provider.id} />
            <div className="mt-4 border-t border-[#e8e0d4] pt-4">
              <AddProductForm providerId={provider.id} units={units} />
            </div>
          </section>
        )}

        <section className="rounded-2xl bg-[#f5f0e8] p-6">
          <DebtForm providerId={provider.id} currentDebt={provider.debt} />
        </section>
      </main>
    </div>
  );
}
