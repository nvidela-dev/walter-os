import { notFound } from "next/navigation";
import type { ReactElement } from "react";

import { DeleteButton } from "@/components/delete-button";
import { PageHeader } from "@/components/ui/page-header";
import { deleteMenuItem } from "@/lib/actions/menu";
import { getMenuItem, getRecipeOptions } from "@/lib/queries/menu";

import { MenuForm } from "../menu-form";

export const dynamic = "force-dynamic";

export default async function MenuItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<ReactElement> {
  const { id } = await params;
  const [item, recipes] = await Promise.all([getMenuItem(id), getRecipeOptions()]);
  if (!item) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-[#faf8f5]">
      <PageHeader
        backHref="/menu"
        title={item.name}
        actions={<DeleteButton id={item.id} name={item.name} deleteAction={deleteMenuItem} redirectTo="/menu" />}
      />
      <main className="flex-1 px-6 py-4"><div className="rounded-2xl bg-[#f5f0e8] p-6"><MenuForm item={item} recipes={recipes} /></div></main>
    </div>
  );
}
