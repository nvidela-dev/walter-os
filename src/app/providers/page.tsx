import Link from "next/link";
import { getProviders } from "./actions";

export default async function ProvidersPage() {
  const providers = await getProviders();

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl">←</Link>
          <h1 className="text-xl font-bold text-gray-800">Providers</h1>
        </div>
        <Link href="/providers/new" className="flex h-12 items-center gap-2 rounded-full bg-blue-500 px-5 text-lg font-medium text-white shadow-md active:scale-95">
          <span className="text-2xl">+</span><span>Add</span>
        </Link>
      </header>

      <main className="flex-1 p-4">
        {providers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 text-6xl">🏪</div>
            <h2 className="mb-2 text-xl font-semibold text-gray-700">No providers yet</h2>
            <p className="mb-6 text-gray-500">Add your first provider to get started</p>
            <Link href="/providers/new" className="rounded-full bg-blue-500 px-6 py-3 text-lg font-medium text-white shadow-md active:scale-95">Add Provider</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {providers.map((provider) => (
              <Link key={provider.id} href={`/providers/${provider.id}`} className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm active:bg-gray-50">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100 text-2xl">🏪</div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800">{provider.nombre}</h3>
                  <p className="text-sm text-gray-500">Debt: ${provider.deuda}</p>
                </div>
                <div className="text-2xl text-gray-400">→</div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
