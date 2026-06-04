import { notFound } from "next/navigation";
import type { ReactElement } from "react";

import { PageHeader } from "@/components/ui/page-header";
import { t } from "@/i18n";
import { getProductForProvider } from "@/lib/queries/products";
import { getProvider } from "@/lib/queries/providers";
import { getUnits } from "@/lib/queries/units";

import { ProductEditForm } from "./product-edit-form";

export const dynamic = "force-dynamic";

interface ProductEditPageProps {
  params: Promise<{ id: string; productId: string }>;
}

export default async function ProductEditPage({
  params,
}: ProductEditPageProps): Promise<ReactElement> {
  const { id, productId } = await params;

  const [provider, product, units] = await Promise.all([
    getProvider(id),
    getProductForProvider(id, productId),
    getUnits(),
  ]);

  if (!provider || !product) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#faf8f5]">
      <PageHeader backHref={`/providers/${id}`} title={t.products.editTitle} />

      <main className="flex-1 px-6 py-4">
        <section className="rounded-2xl bg-[#f5f0e8] p-6">
          <ProductEditForm
            providerId={id}
            productId={productId}
            product={product}
            units={units}
          />
        </section>
      </main>
    </div>
  );
}
