import type { ReactElement } from "react";

interface FormMessageProps {
  message: string | null;
  tone?: "error" | "success";
  className?: string;
}

export function FormMessage({
  message,
  tone = "error",
  className = "",
}: FormMessageProps): ReactElement | null {
  if (message === null || message === "") return null;

  const classes =
    tone === "success"
      ? "bg-emerald-50 text-emerald-800"
      : "bg-amber-50 text-amber-900";

  return <p className={`rounded-xl px-4 py-3 text-sm ${classes} ${className}`}>{message}</p>;
}

export function FieldError({ message }: { message?: string }): ReactElement | null {
  if (message == null || message === "") return null;
  return <p className="mt-1 text-xs text-amber-700">{message}</p>;
}
