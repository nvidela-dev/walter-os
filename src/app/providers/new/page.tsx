import type { ReactElement } from "react";

import { PageHeader } from "@/components/ui/page-header";
import { t } from "@/i18n";

import { ProviderForm } from "../provider-form";

export default function NewProviderPage(): ReactElement {
  return (
    <div className="app-page flex flex-col bg-white">
      <PageHeader backHref="/providers" title={t.providers.newTitle} />
      <main className="flex-1 py-5">
        <div className="app-card rounded-2xl bg-white p-6">
          <ProviderForm />
        </div>
      </main>
    </div>
  );
}
