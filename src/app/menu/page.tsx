import Link from "next/link";
import { getMenuItems } from "./actions";

export default async function MenuPage() {
  const items = await getMenuItems();

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl">←</Link>
          <h1 className="text-xl font-bold text-gray-800">Menu</h1>
        </div>
        <Link href="/menu/new" className="flex h-12 items-center gap-2 rounded-full bg-red-500 px-5 text-lg font-medium text-white shadow-md active:scale-95">
          <span className="text-2xl">+</span><span>Add</span>
        </Link>
      </header>

      <main className="flex-1 p-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 text-6xl">🍽️</div>
            <h2 className="mb-2 text-xl font-semibold text-gray-700">No menu items yet</h2>
            <p className="mb-6 text-gray-500">Add items you sell</p>
            <Link href="/menu/new" className="rounded-full bg-red-500 px-6 py-3 text-lg font-medium text-white shadow-md active:scale-95">Add Item</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <Link key={item.id} href={`/menu/${item.id}`} className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm active:bg-gray-50">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-red-100 text-2xl">🍽️</div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800">{item.nombre}</h3>
                  <p className="text-sm text-gray-500">${item.precioVenta}{item.recetaNombre && ` · ${item.recetaNombre}`}</p>
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
