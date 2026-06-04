import { notFound } from "next/navigation";
import type { ReactElement } from "react";

import { DeleteButton } from "@/components/delete-button";
import { PageHeader } from "@/components/ui/page-header";
import { deleteEmployee } from "@/lib/actions/employees";
import { getEmployee } from "@/lib/queries/employees";

import { EmployeeForm } from "../employee-form";

export const dynamic = "force-dynamic";

export default async function EmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<ReactElement> {
  const { id } = await params;
  const employee = await getEmployee(id);
  if (!employee) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-[#faf8f5]">
      <PageHeader
        backHref="/employees"
        title={employee.name}
        actions={<DeleteButton id={employee.id} name={employee.name} deleteAction={deleteEmployee} redirectTo="/employees" />}
      />
      <main className="flex-1 px-6 py-4"><div className="rounded-2xl bg-[#f5f0e8] p-6"><EmployeeForm employee={employee} /></div></main>
    </div>
  );
}
