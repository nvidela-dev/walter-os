import type { ReactElement } from "react";

import { PageHeader } from "@/components/ui/page-header";
import { requireAccess } from "@/lib/auth/access";

import { DatabaseChat } from "./database-chat";

export const dynamic = "force-dynamic";

export default async function DatabaseChatPage(): Promise<ReactElement> {
  await requireAccess("main");
  return <main className="space-y-4 py-4">
    <PageHeader title="Preguntale a Luna" backHref="/dashboard" />
    <DatabaseChat />
  </main>;
}
