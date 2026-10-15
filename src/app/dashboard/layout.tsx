import type { ReactNode } from "react";

import { requireAccess } from "@/lib/auth/access";

export default async function DashboardLayout({ children }: { children: ReactNode }): Promise<ReactNode> {
  await requireAccess("main");
  return children;
}
