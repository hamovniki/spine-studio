"use client";

import { LockKeyhole, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { SpineLogo } from "@/components/brand/spine-logo";
import { useViewerStore } from "@/store/viewer-store";

export function Header() {
  const { resolvedTheme, setTheme } = useTheme();
  const character = useViewerStore((state) => state.character);
  const isDark = resolvedTheme !== "light";

  return (
    <header className="relative z-30 flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface/80 px-4 backdrop-blur-xl sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex items-center gap-2.5">
          <SpineLogo className="h-8 w-8 text-accent" />
          <div className="flex flex-col leading-none">
            <span className="text-[13px] font-semibold tracking-[0.18em] text-foreground">
              SPINE
            </span>
            <span className="mt-1 text-[9px] font-medium tracking-[0.26em] text-muted">
              STUDIO
            </span>
          </div>
        </div>

        <span className="mx-1 hidden h-6 w-px bg-border sm:block" />

        <span className="hidden items-center gap-1.5 rounded-full border border-border bg-panel px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted sm:inline-flex">
          <LockKeyhole className="h-3 w-3" />
          Local only
        </span>

        {character ? (
          <span className="hidden items-center gap-2 rounded-full border border-accent/20 bg-accent-soft px-2.5 py-1 font-mono text-[10px] font-medium tracking-wide text-accent md:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            {character.version.runtimeLabel}
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        {character ? (
          <span className="hidden max-w-[220px] truncate font-mono text-[11px] text-muted lg:block">
            {character.name}
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
          title={isDark ? "Light theme" : "Dark theme"}
          className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-raised text-muted-strong transition-colors hover:border-border-strong hover:text-foreground"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
        </button>
      </div>
    </header>
  );
}
