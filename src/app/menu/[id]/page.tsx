import { redirect } from "next/navigation";

import { requireAccess } from "@/lib/auth/access";
export default async function LegacyMenuItemPage(): Promise<never> {
  await requireAccess("main");
  redirect("/menu");
}
