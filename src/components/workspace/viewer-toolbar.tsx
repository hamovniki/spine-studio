"use client";

import {
  FolderOpen,
  Maximize2,
  Pause,
  Play,
  Repeat2,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useViewerStore } from "@/store/viewer-store";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function ViewerToolbar() {
  const character = useViewerStore((state) => state.character);
  const selectedAnimation = useViewerStore(
    (state) => state.selectedAnimation,
  );
  const isPlaying = useViewerStore((state) => state.isPlaying);
  const loop = useViewerStore((state) => state.loop);
  const speed = useViewerStore((state) => state.speed);
  const timelineMode = useViewerStore((state) => state.timelineMode);
  const timelinePlaying = useViewerStore((state) => state.timelinePlaying);
  const timeline = useViewerStore((state) => state.timeline);
  const togglePlaying = useViewerStore((state) => state.togglePlaying);
  const toggleTimeline = useViewerStore((state) => state.toggleTimeline);
  const restart = useViewerStore((state) => state.restart);
  const restartTimeline = useViewerStore((state) => state.restartTimeline);
  const setLoop = useViewerStore((state) => state.setLoop);
  const setSpeed = useViewerStore((state) => state.setSpeed);
  const requestFit = useViewerStore((state) => state.requestFit);
  const reset = useViewerStore((state) => state.reset);

  const playing = timelineMode ? timelinePlaying : isPlaying;
  const disabled = timelineMode
    ? timeline.length === 0
    : !selectedAnimation;

  const cycleSpeed = () => {
    const index = SPEEDS.indexOf(speed);
    setSpeed(SPEEDS[(index + 1) % SPEEDS.length] ?? 1);
  };

  const togglePlayback = timelineMode ? toggleTimeline : togglePlaying;
  const restartPlayback = timelineMode ? restartTimeline : restart;

  return (
    <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-surface/85 px-3 backdrop-blur-xl sm:px-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-panel font-mono text-[10px] font-semibold uppercase text-accent">
          {character?.name.slice(0, 2) || "SP"}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-foreground">
            {character?.name ?? "Loading skeleton"}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 truncate font-mono text-[9px] uppercase tracking-wide text-muted">
            {timelineMode ? (
              <>
                <span className="text-accent">sequence</span>
                <span className="text-border-strong">/</span>
                <span>{timeline.length} clips</span>
              </>
            ) : (
              <>
                <span>{character?.version.raw ?? "—"}</span>
                <span className="hidden text-border-strong sm:inline">/</span>
                <span className="hidden sm:inline">
                  {character?.animations.length ?? 0} animations
                </span>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setLoop(!loop)}
          className={cn(
            "max-sm:hidden",
            loop && "bg-accent-soft text-accent hover:bg-accent-soft",
          )}
          title={
            timelineMode
              ? loop
                ? "Sequence looping on"
                : "Sequence looping off"
              : loop
                ? "Looping on"
                : "Looping off"
          }
          aria-pressed={loop}
        >
          <Repeat2 className="h-3.5 w-3.5" />
          Loop
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={cycleSpeed}
          className="max-sm:hidden min-w-10 font-mono text-[10px]"
          title="Playback speed"
        >
          {speed}×
        </Button>

        <span className="mx-1 hidden h-5 w-px bg-border sm:block" />

        <Button
          size="sm"
          variant={playing ? "secondary" : "primary"}
          onClick={togglePlayback}
          disabled={disabled}
          className="min-w-[74px]"
          title={timelineMode ? "Play or pause sequence" : "Play or pause animation"}
        >
          {playing ? (
            <Pause className="h-3.5 w-3.5" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
          {playing ? "Pause" : "Play"}
        </Button>

        <Button
          size="icon"
          variant="ghost"
          onClick={restartPlayback}
          disabled={disabled}
          title={
            timelineMode ? "Restart sequence" : "Restart animation"
          }
          aria-label={
            timelineMode ? "Restart sequence" : "Restart animation"
          }
        >
          <RotateCcw className="h-4 w-4" />
        </Button>

        <Button
          size="icon"
          variant="ghost"
          onClick={requestFit}
          title="Fit character to view"
          aria-label="Fit character to view"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>

        <Button
          size="icon"
          variant="ghost"
          onClick={reset}
          title="Load different files"
          aria-label="Load different files"
          className="max-sm:hidden"
        >
          <FolderOpen className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
