import type { ReactElement } from "react";

import { EmptyState, ListPageRow, ListPageShell } from "@/components/list-page-shell";

import { getEmployees } from "./actions";

export const dynamic = "force-dynamic";

export default async function EmployeesPage(): Promise<ReactElement> {
  const employees = await getEmployees();

  return (
    <ListPageShell
      title="Equipo"
      backHref="/"
      addHref="/employees/new"
      items={employees}
      renderItem={(emp) => (
        <ListPageRow
          key={emp.id}
          href={`/employees/${emp.id}`}
          emoji="🙏"
          title={emp.nombre}
          subtitle={`$${emp.salarioMensual}/mes`}
        />
      )}
      emptyState={
        <EmptyState
          emoji="🙏"
          title="Sin empleados"
          description="Agrega a los miembros del equipo"
          ctaHref="/employees/new"
          ctaText="Agregar Miembro"
        />
      }
    />
  );
}
