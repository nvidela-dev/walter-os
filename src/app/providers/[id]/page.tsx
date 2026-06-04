import { notFound } from "next/navigation";
import type { ReactElement } from "react";

import { DeleteButton } from "@/components/delete-button";
import { PageHeader } from "@/components/ui/page-header";
import { deleteProvider } from "@/lib/actions/providers";
import { getProviderWithProducts } from "@/lib/queries/providers";
import { getUnits } from "@/lib/queries/units";

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
      <PageHeader
        backHref="/providers"
        title={provider.name}
        actions={<DeleteButton id={provider.id} name={provider.name} deleteAction={deleteProvider} redirectTo="/providers" />}
      />

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
