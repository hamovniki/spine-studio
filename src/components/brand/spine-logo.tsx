import { cn } from "@/lib/utils";

export function SpineLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("h-8 w-8", className)}
    >
      <rect width="32" height="32" rx="9" fill="currentColor" />
      <circle cx="9.5" cy="9" r="2.2" fill="var(--accent-foreground)" />
      <circle cx="22.5" cy="9" r="2.2" fill="var(--accent-foreground)" />
      <circle cx="16" cy="16" r="2.5" fill="var(--accent-foreground)" />
      <circle cx="9.5" cy="23" r="2.2" fill="var(--accent-foreground)" />
      <circle cx="22.5" cy="23" r="2.2" fill="var(--accent-foreground)" />
      <path
        d="M11.3 10.2 14 14.2M20.7 10.2 18 14.2M16 18.5v2.2M11.3 21.8l2.7-3.4M20.7 21.8l-2.7-3.4"
        stroke="var(--accent-foreground)"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
