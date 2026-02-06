import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct } from "../actions";
import { ProductForm } from "../product-form";
import { DeleteProductButton } from "./delete-button";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/products"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl"
          >
            ←
          </Link>
          <h1 className="text-xl font-bold text-gray-800">Edit Product</h1>
        </div>
        <DeleteProductButton id={product.id} name={product.nombre} />
      </header>

      {/* Form */}
      <main className="flex-1 p-4">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <ProductForm product={product} />
        </div>
      </main>
    </div>
  );
}
