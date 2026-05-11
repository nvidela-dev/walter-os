import { getEmployees } from "./actions";
import { ListPageShell, EmptyState, ListPageRow } from "@/components/list-page-shell";

export default async function EmployeesPage() {
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
