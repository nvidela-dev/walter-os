import type { ReactElement } from "react";

import { PageHeader } from "@/components/ui/page-header";
import { t } from "@/i18n";
import { getAccessMembers } from "@/lib/queries/access";

import { AccessForm } from "./access-form";

export const dynamic = "force-dynamic";

export default async function AccessPage(): Promise<ReactElement> {
  const members = await getAccessMembers();
  return (
    <div className="app-page max-w-2xl">
      <PageHeader title={t.access.title} backHref="/" />
      <main className="space-y-6 py-5">
      <p className="text-sm text-muted">{t.access.description}</p>
      <AccessForm members={members} />
      </main>
    </div>
  );
}
