import Link from "next/link";
import { notFound } from "next/navigation";
import { getProvider, getProductForProvider, getUnidades } from "../../../actions";
import { ProductEditForm } from "./product-edit-form";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export const dynamic = "force-dynamic";

interface ProductEditPageProps {
  params: Promise<{ id: string; productId: string }>;
}

export default async function ProductEditPage({ params }: ProductEditPageProps) {
  const { id, productId } = await params;

  const [provider, product, unidades] = await Promise.all([
    getProvider(id),
    getProductForProvider(id, productId),
    getUnidades(),
  ]);

  if (!provider || !product) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#faf8f5]">
      <header className="sticky top-0 z-10 flex items-center gap-4 bg-[#faf8f5]/90 px-6 py-5 backdrop-blur-sm">
        <Link href={`/providers/${id}`} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f0e8] text-[#8b7355]">
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-light text-[#3d3530]">Editar Producto</h1>
      </header>

      <main className="flex-1 px-6 py-4">
        <section className="rounded-2xl bg-[#f5f0e8] p-6">
          <ProductEditForm
            providerId={id}
            productId={productId}
            product={product}
            unidades={unidades}
          />
        </section>
      </main>
    </div>
  );
}
