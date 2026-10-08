import { notFound } from "next/navigation";
import type { ReactElement } from "react";

import { DeleteButton } from "@/components/delete-button";
import { PageHeader } from "@/components/ui/page-header";
import { deleteProvider } from "@/lib/actions/providers";
import { getUnlinkedProducts } from "@/lib/queries/products";
import { getProviderWithProducts } from "@/lib/queries/providers";
import { getUnits } from "@/lib/queries/units";

import { ProviderForm } from "../provider-form";
import { AddProductForm } from "./add-product-form";
import { DebtForm } from "./debt-form";
import { LinkProductForm } from "./link-product-form";
import { ProductList } from "./product-list";

export const dynamic = "force-dynamic";

interface ProviderPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProviderPage({
  params,
}: ProviderPageProps): Promise<ReactElement> {
  const { id } = await params;
  const [provider, units, unlinkedProducts] = await Promise.all([
    getProviderWithProducts(id),
    getUnits(),
    getUnlinkedProducts(id),
  ]);

  if (!provider) {
    notFound();
  }

  return (
    <div className="app-page flex flex-col bg-white">
      <PageHeader
        backHref="/providers"
        title={provider.name}
        actions={<DeleteButton id={provider.id} name={provider.name} deleteAction={deleteProvider} redirectTo="/providers" />}
      />

      <main className="flex-1 space-y-6 py-5">
        <section className="app-card rounded-2xl p-6">
          <ProviderForm provider={provider} />
        </section>

        {provider.type === "producto" && (
          <section className="app-card rounded-2xl p-6">
            <ProductList products={provider.products} providerId={provider.id} />
            <div className="mt-4 border-t border-[#e2e8f0] pt-4">
              <AddProductForm providerId={provider.id} units={units} />
              <LinkProductForm providerId={provider.id} products={unlinkedProducts} />
            </div>
          </section>
        )}

        <section className="app-card rounded-2xl p-6">
          <DebtForm providerId={provider.id} currentDebt={provider.debt} />
        </section>
      </main>
    </div>
  );
}
