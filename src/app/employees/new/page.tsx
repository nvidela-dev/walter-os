import type { ReactElement } from "react";

import { PageHeader } from "@/components/ui/page-header";
import { t } from "@/i18n";

import { EmployeeForm } from "../employee-form";

export default function NewEmployeePage(): ReactElement {
  return (
    <div className="app-page flex flex-col bg-white">
      <PageHeader backHref="/employees" title={t.employees.newTitle} />
      <main className="flex-1 py-5"><div className="app-card rounded-2xl p-6"><EmployeeForm /></div></main>
    </div>
  );
}
