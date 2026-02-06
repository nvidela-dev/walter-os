import Link from "next/link";
import { notFound } from "next/navigation";
import { getHouseExpense, deleteHouseExpense } from "../actions";
import { ExpenseForm } from "../expense-form";
import { DeleteButton } from "@/app/components/delete-button";

export default async function HouseExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const expense = await getHouseExpense(id);
  if (!expense) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/house-expenses" className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl">←</Link>
          <h1 className="text-xl font-bold text-gray-800">Edit Expense</h1>
        </div>
        <DeleteButton id={expense.id} name={expense.nombre} deleteAction={deleteHouseExpense} redirectTo="/house-expenses" />
      </header>
      <main className="flex-1 p-4"><div className="rounded-2xl bg-white p-6 shadow-sm"><ExpenseForm expense={expense} /></div></main>
    </div>
  );
}
