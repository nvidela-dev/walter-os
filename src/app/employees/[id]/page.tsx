import Link from "next/link";
import { notFound } from "next/navigation";
import { getEmployeeWithHours, deleteEmployee } from "../actions";
import { EmployeeForm } from "../employee-form";
import { DeleteButton } from "@/app/components/delete-button";

export default async function EmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const employee = await getEmployeeWithHours(id);
  if (!employee) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/employees" className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl">←</Link>
          <h1 className="text-xl font-bold text-gray-800">Edit Employee</h1>
        </div>
        <DeleteButton id={employee.id} name={employee.nombre} deleteAction={deleteEmployee} redirectTo="/employees" />
      </header>
      <main className="flex-1 space-y-4 p-4">
        <div className="rounded-2xl bg-white p-6 shadow-sm"><EmployeeForm employee={employee} /></div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-800">Extra Hours</h2>
          {employee.horasExtra.length === 0 ? (
            <p className="text-gray-500">No extra hours recorded. Feature coming soon.</p>
          ) : (
            <div className="space-y-2">
              {employee.horasExtra.map((h) => (
                <div key={h.id} className="flex justify-between rounded-xl bg-gray-50 p-3">
                  <span>{h.fecha}</span>
                  <span>{h.horas}h - ${h.montoPagado}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
