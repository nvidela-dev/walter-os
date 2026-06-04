import type { ReactElement } from "react";

import { PageHeader } from "@/components/ui/page-header";
import { t } from "@/i18n";

import { EmployeeForm } from "../employee-form";

export default function NewEmployeePage(): ReactElement {
  return (
    <div className="flex min-h-screen flex-col bg-[#faf8f5]">
      <PageHeader backHref="/employees" title={t.employees.newTitle} />
      <main className="flex-1 px-6 py-4"><div className="rounded-2xl bg-[#f5f0e8] p-6"><EmployeeForm /></div></main>
    </div>
  );
}
