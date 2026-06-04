import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";

import { DeleteButton } from "@/components/delete-button";

import { deleteMenuItem, getAllRecipes, getMenuItem } from "../actions";
import { MenuForm } from "../menu-form";

export const dynamic = "force-dynamic";

export default async function MenuItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<ReactElement> {
  const { id } = await params;
  const [item, recipes] = await Promise.all([getMenuItem(id), getAllRecipes()]);
  if (!item) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-[#faf8f5]">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-[#faf8f5]/90 px-6 py-5 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Link href="/menu" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f0e8] text-lg text-[#8b7355]">←</Link>
          <h1 className="text-xl font-light text-[#3d3530]">{item.name}</h1>
        </div>
        <DeleteButton id={item.id} name={item.name} deleteAction={deleteMenuItem} redirectTo="/menu" />
      </header>
      <main className="flex-1 px-6 py-4"><div className="rounded-2xl bg-[#f5f0e8] p-6"><MenuForm item={item} recipes={recipes} /></div></main>
    </div>
  );
}
