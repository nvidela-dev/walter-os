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
    <div className="flex min-h-screen flex-col bg-[#faf8f5]">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-[#faf8f5]/90 px-6 py-5 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Link href="/house-expenses" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f0e8] text-lg text-[#8b7355]">←</Link>
          <h1 className="text-xl font-light text-[#3d3530]">{expense.nombre}</h1>
        </div>
        <DeleteButton id={expense.id} name={expense.nombre} deleteAction={deleteHouseExpense} redirectTo="/house-expenses" />
      </header>
      <main className="flex-1 px-6 py-4"><div className="rounded-2xl bg-[#f5f0e8] p-6"><ExpenseForm expense={expense} /></div></main>
    </div>
  );
}
