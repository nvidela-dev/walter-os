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
      : "bg-red-50 text-red-800";

  return <p role={tone === "error" ? "alert" : "status"} className={`rounded-xl px-4 py-3 text-sm ${classes} ${className}`}>{message}</p>;
}
