import type { ReactElement } from "react";

import { getMenuItems, getMenuSections } from "@/lib/queries/menu";

import { MenuCatalogue } from "./menu-catalogue";

export const dynamic = "force-dynamic";
export default async function MenuPage(): Promise<ReactElement> {
  const [items, sections] = await Promise.all([getMenuItems(), getMenuSections()]);
  return <MenuCatalogue items={items} sections={sections} />;
}
