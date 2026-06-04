import type { ButtonHTMLAttributes, ReactElement } from "react";

import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "default" | "compact" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-[#c4a77d] text-white shadow-sm active:scale-[0.99]",
  secondary: "border-2 border-[#e8e0d4] text-[#8b7355]",
  ghost: "bg-[#f5f0e8] text-[#8b7355] hover:bg-[#e8e0d4]",
  danger: "bg-[#a68b5b] text-white",
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
    "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors disabled:opacity-50",
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
