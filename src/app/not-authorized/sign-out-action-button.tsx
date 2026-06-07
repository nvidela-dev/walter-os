"use client";

import { useClerk } from "@clerk/nextjs";
import type { ReactElement } from "react";

export function SignOutActionButton({ label }: { label: string }): ReactElement {
  const { signOut } = useClerk();

  return (
    <button
      type="button"
      onClick={() => void signOut({ redirectUrl: "/" })}
      className="rounded-2xl bg-[#2388d1] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(35,136,209,0.28)] transition active:scale-[0.98]"
    >
      {label}
    </button>
  );
}
