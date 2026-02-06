import Link from "next/link";
import { notFound } from "next/navigation";
import { getMenuItem, deleteMenuItem, getAllRecipes } from "../actions";
import { MenuForm } from "../menu-form";
import { DeleteButton } from "@/app/components/delete-button";

export default async function MenuItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [item, recipes] = await Promise.all([getMenuItem(id), getAllRecipes()]);
  if (!item) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/menu" className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl">←</Link>
          <h1 className="text-xl font-bold text-gray-800">Edit Menu Item</h1>
        </div>
        <DeleteButton id={item.id} name={item.nombre} deleteAction={deleteMenuItem} redirectTo="/menu" />
      </header>
      <main className="flex-1 p-4"><div className="rounded-2xl bg-white p-6 shadow-sm"><MenuForm item={item} recipes={recipes} /></div></main>
    </div>
  );
}
