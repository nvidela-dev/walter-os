import Link from "next/link";
import type { ReactElement } from "react";

import { t } from "@/i18n";
import { getAccessMembers } from "@/lib/queries/access";

import { AccessForm } from "./access-form";

export const dynamic = "force-dynamic";

export default async function AccessPage(): Promise<ReactElement> {
  const members = await getAccessMembers();
  return (
    <main className="app-page max-w-2xl space-y-6">
      <Link href="/" className="text-sm text-warm-dark">← {t.access.mainApp}</Link>
      <h1 className="text-3xl font-semibold">{t.access.title}</h1>
      <p className="text-sm text-muted">{t.access.description}</p>
      <AccessForm members={members} />
    </main>
  );
}
