"use client";

import {
  Bug,
  Clapperboard,
  Layers,
  LockKeyhole,
  SlidersHorizontal,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AnimationsTab } from "@/components/sidebar/animations-tab";
import { DebugTab } from "@/components/sidebar/debug-tab";
import { SettingsTab } from "@/components/sidebar/settings-tab";
import { TimelineTab } from "@/components/sidebar/timeline-tab";
import { cn } from "@/lib/utils";
import {
  getFileSummary,
  useViewerStore,
  type SidebarTab,
} from "@/store/viewer-store";

const TABS: Array<{
  id: SidebarTab;
  label: string;
  icon: LucideIcon;
}> = [
  { id: "animations", label: "Animations", icon: Clapperboard },
  { id: "debug", label: "Debug", icon: Bug },
  { id: "timeline", label: "Timeline", icon: Layers },
  { id: "settings", label: "Settings", icon: SlidersHorizontal },
];

function TabContent({ tab }: { tab: SidebarTab }) {
  if (tab === "animations") return <AnimationsTab />;
  if (tab === "debug") return <DebugTab />;
  if (tab === "timeline") return <TimelineTab />;
  return <SettingsTab />;
}

export function Sidebar() {
  const character = useViewerStore((state) => state.character);
  const files = useViewerStore((state) => state.files);
  const activeTab = useViewerStore((state) => state.sidebarTab);
  const setSidebarTab = useViewerStore((state) => state.setSidebarTab);
  const imageCount = getFileSummary(files).images.length;
  const initials = (character?.name ?? "SP")
    .split(/[\s_-]+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <aside className="flex h-full min-h-0 w-full shrink-0 flex-col border-border bg-surface lg:w-[352px] lg:border-r">
      <div className="shrink-0 border-b border-border p-3.5">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent/20 bg-[radial-gradient(circle_at_30%_20%,var(--accent-soft),transparent_70%)] font-mono text-[11px] font-semibold text-accent">
            {initials || "SP"}
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-accent" />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[13px] font-medium tracking-[-0.01em] text-foreground">
              {character?.name ?? "Untitled skeleton"}
            </h2>
            <p className="mt-0.5 flex items-center gap-1.5 truncate font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
              <span>Spine {character?.version.raw ?? "—"}</span>
              <span className="text-border-strong">·</span>
              <span>{character?.animations.length ?? 0} anims</span>
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="rounded-md border border-accent/20 bg-accent-soft px-2 py-1 font-mono text-[9px] font-medium text-accent">
            {character?.version.runtimeLabel ?? "runtime"}
          </span>
          <span className="rounded-md border border-border bg-panel px-2 py-1 font-mono text-[9px] text-muted">
            PixiJS 7
          </span>
          <span className="rounded-md border border-border bg-panel px-2 py-1 font-mono text-[9px] text-muted">
            {imageCount} png
          </span>
          <span className="rounded-md border border-border bg-panel px-2 py-1 font-mono text-[9px] text-muted">
            local session
          </span>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Spine viewer controls"
        className="grid shrink-0 grid-cols-4 gap-1 border-b border-border p-1.5"
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = id === activeTab;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              id={`tab-${id}`}
              aria-selected={active}
              aria-controls="sidebar-panel"
              onClick={() => setSidebarTab(id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-[9px] font-medium transition-colors",
                active
                  ? "bg-surface-raised text-foreground shadow-sm ring-1 ring-border"
                  : "text-muted hover:bg-panel/60 hover:text-muted-strong",
              )}
            >
              <Icon
                className={cn(
                  "h-3.5 w-3.5",
                  active ? "text-accent" : "text-muted",
                )}
              />
              {label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id="sidebar-panel"
        aria-labelledby={`tab-${activeTab}`}
        className="scrollbar-thin min-h-0 flex-1 overflow-y-auto"
      >
        <TabContent tab={activeTab} />
      </div>

      <div className="flex shrink-0 items-center justify-between border-t border-border px-3 py-2.5">
        <span className="flex items-center gap-1.5 text-[10px] text-muted">
          <LockKeyhole className="h-3 w-3" />
          Files stay in this browser
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
          {files.length} files
        </span>
      </div>
    </aside>
  );
}
