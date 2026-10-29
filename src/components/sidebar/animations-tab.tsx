"use client";

import {
  AudioLines,
  Check,
  Copy,
  Gauge,
  Layers,
  Pause,
  Play,
  Repeat2,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { generateAnimationsCode } from "@/lib/generate-animations-code";
import { cn, formatDuration } from "@/lib/utils";
import { useViewerStore } from "@/store/viewer-store";

function PlaybackBars() {
  return (
    <span className="flex h-3.5 items-end gap-[2px]" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="animate-pulse-soft w-[2px] rounded-full bg-accent"
          style={{
            height: `${[9, 14, 6][index]}px`,
            animationDelay: `${index * 120}ms`,
          }}
        />
      ))}
    </span>
  );
}

export function AnimationsTab() {
  const [query, setQuery] = useState("");
  const character = useViewerStore((state) => state.character);
  const selectedAnimation = useViewerStore(
    (state) => state.selectedAnimation,
  );
  const isPlaying = useViewerStore((state) => state.isPlaying);
  const loop = useViewerStore((state) => state.loop);
  const speed = useViewerStore((state) => state.speed);
  const timelineMode = useViewerStore((state) => state.timelineMode);
  const timelinePlaying = useViewerStore((state) => state.timelinePlaying);
  const selectAnimation = useViewerStore((state) => state.selectAnimation);
  const togglePlaying = useViewerStore((state) => state.togglePlaying);
  const setLoop = useViewerStore((state) => state.setLoop);
  const setSpeed = useViewerStore((state) => state.setSpeed);
  const setSidebarTab = useViewerStore((state) => state.setSidebarTab);

  const animations = useMemo(
    () => character?.animations ?? [],
    [character],
  );
  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return animations;
    return animations.filter((animation) =>
      animation.name.toLowerCase().includes(search),
    );
  }, [animations, query]);

  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle",
  );
  const copyResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
    };
  }, []);

  const copyAnimationsCode = async () => {
    if (!character || animations.length === 0) return;

    try {
      await navigator.clipboard.writeText(
        generateAnimationsCode(character.name, animations),
      );
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }

    if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
    copyResetTimer.current = setTimeout(() => setCopyState("idle"), 2000);
  };

  return (
    <div className="space-y-3 p-3">
      {timelineMode ? (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-accent/25 bg-accent-soft px-3 py-2">
          <span className="flex items-center gap-1.5 text-[10px] font-medium text-accent">
            <Layers className="h-3.5 w-3.5" />
            Sequence {timelinePlaying ? "playing" : "paused"}
          </span>
          <button
            type="button"
            onClick={() => setSidebarTab("timeline")}
            className="text-[10px] font-medium text-accent/80 underline-offset-2 transition-colors hover:text-accent hover:underline"
          >
            Open timeline
          </button>
        </div>
      ) : null}

      <div className="rounded-xl border border-border bg-panel/55 p-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
            Playback
          </span>
          <span className="flex items-center gap-1 font-mono text-[9px] text-muted">
            <Gauge className="h-3 w-3" />
            {speed}×
          </span>
        </div>

        <div className="mt-2.5 flex items-center gap-2">
          <Button
            size="sm"
            variant={isPlaying ? "secondary" : "primary"}
            onClick={togglePlaying}
            disabled={!selectedAnimation}
            className="flex-1"
          >
            {isPlaying ? (
              <Pause className="h-3.5 w-3.5" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            {isPlaying ? "Pause" : "Play"}
          </Button>

          <button
            type="button"
            onClick={() => setLoop(!loop)}
            aria-pressed={loop}
            title="Toggle looping"
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg border transition-colors",
              loop
                ? "border-accent/30 bg-accent-soft text-accent"
                : "border-border bg-surface-raised text-muted hover:text-foreground",
            )}
          >
            <Repeat2 className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between text-[10px] text-muted">
            <span>Speed</span>
            <span className="font-mono">{speed.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}×</span>
          </div>
          <input
            type="range"
            min={0.25}
            max={2}
            step={0.05}
            value={speed}
            onChange={(event) => setSpeed(Number(event.target.value))}
            aria-label="Playback speed"
            className="mt-1 h-1 w-full cursor-pointer appearance-none rounded-full bg-border accent-[var(--accent)]"
          />
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search animations…"
          className="h-9 w-full rounded-lg border border-border bg-surface-raised pl-8 pr-3 text-xs text-foreground placeholder:text-muted/70 focus:border-accent/40 focus:outline-none"
        />
      </div>

      <div className="flex items-center justify-between gap-2 px-0.5">
        <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
          Animations
        </span>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] text-muted">
            {filtered.length}/{animations.length}
          </span>

          <Button
            size="sm"
            variant="ghost"
            onClick={copyAnimationsCode}
            disabled={animations.length === 0}
            aria-label="Copy animations as a JS variable"
            title={
              animations.length === 0
                ? "Load a skeleton to copy its animations"
                : "Copy animations as a JS variable"
            }
            className={cn(
              "h-7 gap-1.5 px-2 text-[10px]",
              copyState === "copied" && "text-accent",
              copyState === "error" && "text-danger",
            )}
          >
            {copyState === "copied" ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            <span aria-live="polite">
              {copyState === "copied"
                ? "Copied!"
                : copyState === "error"
                  ? "Copy failed"
                  : "Copy as JS variable"}
            </span>
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        {filtered.map((animation) => {
          const active = animation.name === selectedAnimation;
          return (
            <button
              key={animation.name}
              type="button"
              onClick={() => selectAnimation(animation.name)}
              className={cn(
                "group flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-colors",
                active
                  ? "border-accent/25 bg-accent-soft"
                  : "border-transparent hover:border-border hover:bg-panel/70",
              )}
              aria-current={active ? "true" : undefined}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border",
                  active
                    ? "border-accent/25 bg-accent/10 text-accent"
                    : "border-border bg-surface-raised text-muted group-hover:text-muted-strong",
                )}
              >
                {active && isPlaying ? (
                  <PlaybackBars />
                ) : (
                  <Play className="h-3 w-3" />
                )}
              </span>

              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block truncate text-[11px] font-medium",
                    active ? "text-foreground" : "text-muted-strong",
                  )}
                >
                  {animation.name}
                </span>
              </span>

              <span className="shrink-0 font-mono text-[9px] text-muted">
                {formatDuration(animation.duration)}
              </span>
            </button>
          );
        })}
      </div>

      {animations.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-border bg-panel/50 px-4 py-8 text-center">
          <AudioLines className="h-6 w-6 text-muted" />
          <p className="mt-2 text-xs font-medium text-muted-strong">
            No animations in this skeleton
          </p>
          <p className="mt-1 text-[11px] leading-4 text-muted">
            The setup pose is shown on the stage.
          </p>
        </div>
      ) : null}

      {animations.length > 0 && filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-[11px] text-muted">
          No animation matches “{query}”.
        </div>
      ) : null}
    </div>
  );
}
