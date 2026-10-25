import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "icon";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-foreground hover:bg-accent-strong shadow-[0_1px_0_rgba(255,255,255,0.18)_inset]",
  secondary:
    "border border-border bg-surface-raised text-foreground hover:border-border-strong hover:bg-panel",
  ghost:
    "text-muted-strong hover:bg-panel hover:text-foreground border border-transparent",
  danger:
    "border border-danger/30 bg-danger-soft text-danger hover:border-danger/50",
};

const sizes: Record<Size, string> = {
  sm: "h-8 gap-1.5 rounded-lg px-2.5 text-xs",
  md: "h-10 gap-2 rounded-xl px-4 text-sm",
  icon: "h-9 w-9 rounded-lg",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  className,
  variant = "secondary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-medium transition-[background-color,border-color,color,opacity,transform] duration-150 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98]",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
