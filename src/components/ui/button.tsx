import type { ButtonHTMLAttributes, ReactElement } from "react";

import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "default" | "compact" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[#2388d1] text-white shadow-[0_12px_28px_rgba(35,136,209,0.28)] active:scale-[0.98]",
  secondary:
    "ios-icon-button text-[#1f2d35] hover:bg-white/70 active:scale-[0.98]",
  ghost:
    "ios-icon-button text-[#43636e] hover:bg-white/70 active:scale-[0.98]",
  danger:
    "bg-[#d95f55] text-white shadow-[0_12px_28px_rgba(217,95,85,0.24)] active:scale-[0.98]",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "px-5 py-3",
  compact: "px-4 py-2 text-sm",
  icon: "h-10 w-10",
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
    "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition disabled:opacity-50",
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
