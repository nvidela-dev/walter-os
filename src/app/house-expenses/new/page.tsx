import Link from "next/link";
import { ExpenseForm } from "../expense-form";

export default function NewHouseExpensePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#faf8f5]">
      <header className="sticky top-0 z-10 flex items-center gap-4 bg-[#faf8f5]/90 px-6 py-5 backdrop-blur-sm">
        <Link href="/house-expenses" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f0e8] text-lg text-[#8b7355]">←</Link>
        <h1 className="text-xl font-light text-[#3d3530]">Nuevo Gasto</h1>
      </header>
      <main className="flex-1 px-6 py-4"><div className="rounded-2xl bg-[#f5f0e8] p-6"><ExpenseForm /></div></main>
    </div>
  );
}
