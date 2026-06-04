interface FormMessageProps {
  message: string | null;
  tone?: "error" | "success";
  className?: string;
}

export function FormMessage({ message, tone = "error", className = "" }: FormMessageProps) {
  if (!message) return null;

  const classes =
    tone === "success"
      ? "bg-emerald-50 text-emerald-800"
      : "bg-amber-50 text-amber-900";

  return <p className={`rounded-xl px-4 py-3 text-sm ${classes} ${className}`}>{message}</p>;
}
