import type { ButtonHTMLAttributes, ReactElement } from "react";

import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "default" | "compact" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "border border-zinc-800 bg-zinc-800 text-white hover:bg-zinc-900 active:bg-zinc-950",
  secondary: "border border-zinc-300 bg-white text-foreground hover:bg-zinc-200 active:bg-zinc-100",
  ghost: "border border-transparent bg-transparent text-muted hover:bg-zinc-100 active:bg-zinc-200",
  danger: "border border-red-600 bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "min-h-11 px-4 py-2.5 text-sm",
  compact: "min-h-11 px-3 py-2 text-sm",
  icon: "h-11 w-11 shrink-0",
};

export function buttonClassName({
  variant = "primary",
  size = "default",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}): string {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
    variantClasses[variant],
    sizeClasses[size],
    className
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  className,
  size = "default",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps): ReactElement {
  return (
    <button
      className={buttonClassName({ variant, size, className })}
      type={type}
      {...props}
    />
  );
}
