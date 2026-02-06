import Link from "next/link";
import { ExpenseForm } from "../expense-form";

export default function NewHouseExpensePage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-white px-4 py-4 shadow-sm">
        <Link href="/house-expenses" className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl">←</Link>
        <h1 className="text-xl font-bold text-gray-800">Add House Expense</h1>
      </header>
      <main className="flex-1 p-4"><div className="rounded-2xl bg-white p-6 shadow-sm"><ExpenseForm /></div></main>
    </div>
  );
}
