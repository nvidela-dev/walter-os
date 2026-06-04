import { UserGroupIcon } from "@heroicons/react/24/outline";
import type { ReactElement } from "react";

import { EmptyState, ListPageRow, ListPageShell } from "@/components/list-page-shell";
import { t } from "@/i18n";
import { getEmployees } from "@/lib/queries/employees";

export const dynamic = "force-dynamic";

export default async function EmployeesPage(): Promise<ReactElement> {
  const employees = await getEmployees();

  return (
    <ListPageShell
      title={t.employees.title}
      backHref="/"
      addHref="/employees/new"
      items={employees}
      renderItem={(emp) => (
        <ListPageRow
          key={emp.id}
          href={`/employees/${emp.id}`}
          icon={UserGroupIcon}
          title={emp.name}
          subtitle={t.employees.monthlyPay(emp.monthlySalary)}
        />
      )}
      emptyState={
        <EmptyState
          icon={UserGroupIcon}
          title={t.employees.emptyTitle}
          description={t.employees.emptyDescription}
          ctaHref="/employees/new"
          ctaText={t.employees.addCta}
        />
      }
    />
  );
}
