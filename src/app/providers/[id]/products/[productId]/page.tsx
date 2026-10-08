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
    <div className="app-page flex flex-col bg-white">
      <PageHeader backHref={`/providers/${id}`} title={t.products.editTitle} />

      <main className="flex-1 py-5">
        <section className="app-card rounded-2xl p-6">
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
