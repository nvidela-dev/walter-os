import Link from "next/link";
import { notFound } from "next/navigation";
import { getProviderWithProducts } from "../actions";
import { ProviderForm } from "../provider-form";
import { DeleteProviderButton } from "./delete-button";

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
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/providers" className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl">←</Link>
          <h1 className="text-xl font-bold text-gray-800">Edit Provider</h1>
        </div>
        <DeleteProviderButton id={provider.id} name={provider.nombre} />
      </header>

      <main className="flex-1 space-y-4 p-4">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <ProviderForm provider={provider} />
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-800">Products from this Provider</h2>
          {provider.productos.length === 0 ? (
            <p className="text-gray-500">No products linked yet. This feature coming soon.</p>
          ) : (
            <div className="space-y-2">
              {provider.productos.map((p) => (
                <div key={p.productoId} className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
                  <span className="font-medium">{p.nombre}</span>
                  <span className="text-green-600">${p.precio}/{p.unidad}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
