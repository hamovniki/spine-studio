"use client";

import {
  ArrowDown,
  ArrowUp,
  Clock3,
  Layers,
  Pause,
  Play,
  Plus,
  Repeat2,
  Square,
  Trash2,
} from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { cn, formatDuration } from "@/lib/utils";
import {
  CLIP_REPEAT_COUNT,
  getTimelineLayout,
  getTimelineMoment,
} from "@/lib/timeline";
import { useViewerStore } from "@/store/viewer-store";

const CLIP_COLORS = ["#c8f36a", "#7dd3fc", "#f9a8d4", "#fcd34d", "#86efac"];

function LoopButton({
  loop,
  onClick,
}: {
  loop: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={loop}
      title={loop ? "Sequence looping on" : "Sequence looping off"}
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors",
        loop
          ? "border-accent/30 bg-accent-soft text-accent"
          : "border-border bg-surface-raised text-muted hover:text-foreground",
      )}
    >
      <Repeat2 className="h-3.5 w-3.5" />
    </button>
  );
}

export function TimelineTab() {
  const timeline = useViewerStore((state) => state.timeline);
  const timelineMode = useViewerStore((state) => state.timelineMode);
  const timelinePlaying = useViewerStore((state) => state.timelinePlaying);
  const timelineTime = useViewerStore((state) => state.timelineTime);
  const timelineActiveClipId = useViewerStore(
    (state) => state.timelineActiveClipId,
  );
  const loop = useViewerStore((state) => state.loop);
  const selectedAnimation = useViewerStore(
    (state) => state.selectedAnimation,
  );
  const character = useViewerStore((state) => state.character);
  const addTimelineClip = useViewerStore((state) => state.addTimelineClip);
  const removeTimelineClip = useViewerStore(
    (state) => state.removeTimelineClip,
  );
  const moveTimelineClip = useViewerStore((state) => state.moveTimelineClip);
  const toggleTimelineLoop = useViewerStore(
    (state) => state.toggleTimelineLoop,
  );
  const clearTimeline = useViewerStore((state) => state.clearTimeline);
  const playTimeline = useViewerStore((state) => state.playTimeline);
  const pauseTimeline = useViewerStore((state) => state.pauseTimeline);
  const stopTimeline = useViewerStore((state) => state.stopTimeline);
  const seekTimeline = useViewerStore((state) => state.seekTimeline);
  const setLoop = useViewerStore((state) => state.setLoop);

  const layout = useMemo(() => getTimelineLayout(timeline), [timeline]);
  const moment = getTimelineMoment(layout, timelineTime);
  const currentClip =
    timeline.find((clip) => clip.id === timelineActiveClipId) ??
    moment?.segment.clip ??
    null;
  const progress =
    layout.total > 0
      ? Math.min(100, Math.max(0, (timelineTime / layout.total) * 100))
      : 0;
  const playing = timelineMode && timelinePlaying;

  const selected = character?.animations.find(
    (animation) => animation.name === selectedAnimation,
  );

  return (
    <div className="space-y-3 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            Sequence builder
            <span className="rounded border border-accent/25 bg-accent-soft px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-accent">
              live
            </span>
          </h3>
          <p className="mt-1 text-[11px] leading-4 text-muted">
            Stack clips, scrub the playhead, and preview the sequence on the
            stage.
          </p>
        </div>
        <span className="font-mono text-[9px] text-muted">
          {formatDuration(layout.total)}
        </span>
      </div>

      <Button
        variant="primary"
        size="sm"
        className="w-full"
        onClick={addTimelineClip}
        disabled={!selected}
      >
        <Plus className="h-3.5 w-3.5" />
        {selected ? `Add “${selected.name}”` : "Select an animation first"}
      </Button>

      {timeline.length > 0 ? (
        <>
          <div className="rounded-xl border border-border bg-panel/50 p-2.5">
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant={playing ? "secondary" : "primary"}
                onClick={playing ? pauseTimeline : playTimeline}
                className="flex-1"
              >
                {playing ? (
                  <Pause className="h-3.5 w-3.5" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
                {playing ? "Pause sequence" : "Play sequence"}
              </Button>

              <Button
                size="icon"
                variant="ghost"
                onClick={stopTimeline}
                title="Stop & rewind"
                aria-label="Stop and rewind sequence"
              >
                <Square className="h-3.5 w-3.5" />
              </Button>

              <LoopButton loop={loop} onClick={() => setLoop(!loop)} />
            </div>

            <div className="mt-2.5">
              <div className="flex items-center justify-between font-mono text-[9px] text-muted">
                <span className={timelineMode ? "text-accent" : undefined}>
                  {formatDuration(timelineTime)}
                </span>
                <span>{formatDuration(layout.total)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={layout.total || 1}
                step={0.01}
                value={Math.min(timelineTime, layout.total)}
                onChange={(event) => seekTimeline(Number(event.target.value))}
                disabled={layout.total <= 0}
                aria-label="Timeline playhead"
                className="mt-1 h-1 w-full cursor-pointer appearance-none rounded-full bg-border accent-[var(--accent)] disabled:cursor-default"
              />
            </div>

            <div className="mt-1.5 flex items-center justify-between gap-2 text-[9px]">
              <span className="font-mono uppercase tracking-[0.12em] text-muted">
                {timelineMode
                  ? playing
                    ? "playing"
                    : timelineTime > 0
                      ? "paused"
                      : "ready"
                  : "not started"}
              </span>
              <span className="flex min-w-0 items-center gap-1 truncate text-muted-strong">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <span className="truncate">
                  {currentClip?.animation ?? "—"}
                </span>
              </span>
            </div>
          </div>

          <div className="relative rounded-xl border border-border bg-panel/50 p-2.5">
            <div className="flex items-end justify-between gap-1">
              <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted">
                0s
              </span>
              <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted">
                {formatDuration(layout.total)}
              </span>
            </div>

            <div className="relative mt-1.5 h-9 w-full overflow-hidden rounded-md border border-border bg-surface-raised">
              <div className="flex h-full w-full">
                {layout.segments.map((segment, index) => {
                  const active = segment.clip.id === timelineActiveClipId;
                  return (
                    <div
                      key={segment.clip.id}
                      title={`${segment.clip.animation} · ${formatDuration(segment.effectiveDuration)}`}
                      className={cn(
                        "flex min-w-[10px] items-center overflow-hidden border-r border-black/15 px-1.5 transition-opacity last:border-r-0",
                        active ? "opacity-100" : "opacity-75",
                      )}
                      style={{
                        width: `${Math.max(10, (segment.effectiveDuration / Math.max(layout.total, 0.001)) * 100)}%`,
                        backgroundColor:
                          CLIP_COLORS[index % CLIP_COLORS.length],
                      }}
                    >
                      <span className="truncate font-mono text-[8px] font-medium text-black/70">
                        {segment.clip.animation}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div
                className="pointer-events-none absolute inset-y-0 left-0 bg-black/15"
                style={{ width: `${progress}%` }}
              />
              <div
                className="pointer-events-none absolute inset-y-0 w-px bg-white shadow-[0_0_8px_rgba(255,255,255,0.75)]"
                style={{ left: `${progress}%` }}
              >
                <span className="absolute -top-0.5 -left-[3px] h-1.5 w-1.5 rounded-full bg-white" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-0.5">
            <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
              Clips
            </span>
            <button
              type="button"
              onClick={clearTimeline}
              className="text-[10px] text-muted transition-colors hover:text-danger"
            >
              Clear all
            </button>
          </div>

          <div className="space-y-1.5">
            {timeline.map((clip, index) => {
              const segment = layout.segments[index];
              const active = clip.id === timelineActiveClipId;
              return (
                <div
                  key={clip.id}
                  className={cn(
                    "group flex items-center gap-2 rounded-lg border px-2 py-2 transition-colors",
                    active
                      ? "border-accent/30 bg-accent-soft"
                      : "border-border bg-surface-raised",
                  )}
                >
                  <span
                    className="h-6 w-1 shrink-0 rounded-full"
                    style={{
                      backgroundColor: CLIP_COLORS[index % CLIP_COLORS.length],
                    }}
                  />
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-border bg-panel font-mono text-[9px] text-muted">
                    {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => seekTimeline(segment?.start ?? 0)}
                    className="min-w-0 flex-1 text-left"
                    title="Jump playhead to this clip"
                  >
                    <p className="truncate text-[11px] font-medium text-foreground">
                      {clip.animation}
                    </p>
                    <p className="flex items-center gap-1 font-mono text-[9px] text-muted">
                      <Clock3 className="h-2.5 w-2.5" />
                      {formatDuration(clip.duration)}
                      {clip.loop ? (
                        <span className="rounded bg-accent/15 px-1 text-accent">
                          ×{CLIP_REPEAT_COUNT}
                        </span>
                      ) : null}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleTimelineLoop(clip.id)}
                    title="Repeat this clip twice"
                    aria-pressed={clip.loop}
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded transition-colors",
                      clip.loop
                        ? "bg-accent-soft text-accent"
                        : "text-muted hover:bg-panel hover:text-foreground",
                    )}
                  >
                    <Repeat2 className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveTimelineClip(clip.id, -1)}
                    disabled={index === 0}
                    title="Move clip up"
                    className="flex h-6 w-6 items-center justify-center rounded text-muted transition-colors hover:bg-panel hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveTimelineClip(clip.id, 1)}
                    disabled={index === timeline.length - 1}
                    title="Move clip down"
                    className="flex h-6 w-6 items-center justify-center rounded text-muted transition-colors hover:bg-panel hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeTimelineClip(clip.id)}
                    title="Remove clip"
                    className="flex h-6 w-6 items-center justify-center rounded text-muted transition-colors hover:bg-danger-soft hover:text-danger"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-panel/35 px-4 py-9 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface-raised text-muted">
            <Layers className="h-4.5 w-4.5" />
          </span>
          <p className="mt-3 text-xs font-medium text-muted-strong">
            Your timeline is empty
          </p>
          <p className="mt-1 max-w-[220px] text-[11px] leading-4 text-muted">
            Pick an animation and add it here to start a sequence.
          </p>
        </div>
      )}

      <div className="rounded-xl border border-border bg-panel/45 px-3 py-2.5">
        <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
          Sequencer notes
        </p>
        <p className="mt-1 text-[10px] leading-4 text-muted">
          Each clip advances in order. The repeat toggle plays a clip twice
          (×{CLIP_REPEAT_COUNT}). The Loop control above repeats the whole
          sequence.
        </p>
      </div>
    </div>
  );
}
