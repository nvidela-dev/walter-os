import Link from "next/link";
import { notFound } from "next/navigation";
import { getProviderWithProducts } from "../actions";
import { ProviderForm } from "../provider-form";
import { DeleteProviderButton } from "./delete-button";
import { ProductList } from "./product-list";
import { AddProductForm } from "./add-product-form";

interface ProviderPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProviderPage({ params }: ProviderPageProps) {
  const { id } = await params;
  const provider = await getProviderWithProducts(id);

  if (!provider) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#faf8f5]">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-[#faf8f5]/90 px-6 py-5 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Link href="/providers" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f0e8] text-lg text-[#8b7355]">←</Link>
          <h1 className="text-xl font-light text-[#3d3530]">{provider.nombre}</h1>
        </div>
        <DeleteProviderButton id={provider.id} name={provider.nombre} />
      </header>

      <main className="flex-1 space-y-6 px-6 py-4">
        {/* Provider Details */}
        <section className="rounded-2xl bg-[#f5f0e8] p-6">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-[#8b7355]">Detalles</h2>
          <ProviderForm provider={provider} />
        </section>

        {/* Products Section */}
        <section className="rounded-2xl bg-[#f5f0e8] p-6">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-[#8b7355]">Productos</h2>

          <ProductList products={provider.productos} providerId={provider.id} />

          <div className="mt-4 border-t border-[#e8e0d4] pt-4">
            <AddProductForm providerId={provider.id} />
          </div>
        </section>
      </main>
    </div>
  );
}
