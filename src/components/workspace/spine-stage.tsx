"use client";

import type { Application, Container } from "pixi.js";
import { useCallback, useEffect, useRef, useState } from "react";
import { useViewerStore, getSkeletonName } from "@/store/viewer-store";
import { cn, formatDuration, pickDefaultAnimation } from "@/lib/utils";
import {
  getTimelineLayout,
  getTimelineMoment,
} from "@/lib/timeline";
import type { SpineHandle } from "@/lib/spine/types";

interface StageView {
  app: Application;
  world: Container;
  handle: SpineHandle | null;
  fit: () => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function SpineStage({ files }: { files: File[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<StageView | null>(null);
  const handleRef = useRef<SpineHandle | null>(null);
  const fitRef = useRef<(() => void) | null>(null);
  const timelineTimeRef = useRef(0);
  const timelineClipIdRef = useRef<string | null>(null);
  const lastTimelinePublishRef = useRef(0);
  const [ready, setReady] = useState(false);
  const [fps, setFps] = useState(0);
  const [dragging, setDragging] = useState(false);

  const backgroundColor = useViewerStore((state) => state.backgroundColor);
  const showFps = useViewerStore((state) => state.showFps);
  const selectedAnimation = useViewerStore(
    (state) => state.selectedAnimation,
  );
  const isPlaying = useViewerStore((state) => state.isPlaying);
  const loop = useViewerStore((state) => state.loop);
  const speed = useViewerStore((state) => state.speed);
  const debug = useViewerStore((state) => state.debug);
  const playNonce = useViewerStore((state) => state.playNonce);
  const fitNonce = useViewerStore((state) => state.fitNonce);
  const character = useViewerStore((state) => state.character);
  const loadNonce = useViewerStore((state) => state.loadNonce);
  const timelineMode = useViewerStore((state) => state.timelineMode);
  const timelinePlaying = useViewerStore((state) => state.timelinePlaying);
  const timeline = useViewerStore((state) => state.timeline);
  const timelineSeekNonce = useViewerStore(
    (state) => state.timelineSeekNonce,
  );
  const timelineActiveClipId = useViewerStore(
    (state) => state.timelineActiveClipId,
  );
  const loadSuccess = useViewerStore((state) => state.loadSuccess);
  const loadFailure = useViewerStore((state) => state.loadFailure);

  const activeDebug =
    debug.bones || debug.mesh || debug.paths || debug.boundingBoxes || debug.regions;

  const applyTimelineAt = useCallback((time: number): string | null => {
    const handle = handleRef.current;
    if (!handle) return null;
    const state = useViewerStore.getState();
    const layout = getTimelineLayout(state.timeline);
    const moment = getTimelineMoment(layout, time);

    if (!moment) {
      handle.play(null, false);
      return null;
    }

    const clip = moment.segment.clip;
    const animationDuration = Math.max(clip.duration, 0.01);
    const localTime = clip.loop
      ? moment.localTime % animationDuration
      : Math.min(
          moment.localTime,
          Math.max(animationDuration - 0.001, 0),
        );

    handle.setPaused(false);
    handle.play(clip.animation, clip.loop, localTime);
    return clip.id;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let disposed = false;
    let app: Application | null = null;
    let fpsInterval: ReturnType<typeof setInterval> | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let removeListeners: (() => void) | null = null;

    const cleanupStage = () => {
      if (disposed) return;
      disposed = true;

      if (fpsInterval) clearInterval(fpsInterval);
      resizeObserver?.disconnect();
      removeListeners?.();

      const handle = handleRef.current;
      handleRef.current = null;
      fitRef.current = null;
      timelineTimeRef.current = 0;
      timelineClipIdRef.current = null;
      lastTimelinePublishRef.current = 0;

      if (app) {
        try {
          app.ticker.stop();
          if (handle) {
            handle.object.removeFromParent();
          }
          app.destroy(true);
        } catch {
          // Pixi can already be partially destroyed during fast unmounts.
        }
        app = null;
      }

      try {
        handle?.destroy();
      } catch {
        // Ignore cleanup races in development Strict Mode.
      }

      stageRef.current = null;
    };

    const boot = async () => {
      try {
        const PIXI = await import("pixi.js");
        if (cancelled) return;

        const width = Math.max(1, container.clientWidth);
        const height = Math.max(1, container.clientHeight);
        app = new PIXI.Application({
          width,
          height,
          antialias: true,
          backgroundAlpha: 0,
          autoDensity: true,
          resolution: Math.min(window.devicePixelRatio || 1, 2),
          powerPreference: "high-performance",
        });

        if (cancelled) {
          app.destroy(true);
          app = null;
          return;
        }

        const canvas = app.view as HTMLCanvasElement;
        canvas.className = "block h-full w-full outline-none";
        canvas.setAttribute("aria-label", "Spine animation canvas");
        container.appendChild(canvas);

        const world = new PIXI.Container();
        app.stage.addChild(world);

        const fit = () => {
          if (!stageRef.current) return;
          const handle = stageRef.current.handle;
          const currentApp = stageRef.current.app;
          const bounds = handle?.getBounds() ?? null;
          const screenWidth = currentApp.screen.width;
          const screenHeight = currentApp.screen.height;
          const padding = Math.min(screenWidth, screenHeight) * 0.12;

          if (!bounds || bounds.width <= 0 || bounds.height <= 0) {
            world.scale.set(1);
            world.position.set(screenWidth / 2, screenHeight / 2);
            return;
          }

          const scale = clamp(
            Math.min(
              (screenWidth - padding * 2) / bounds.width,
              (screenHeight - padding * 2) / bounds.height,
            ),
            0.02,
            3,
          );

          world.scale.set(scale);
          world.position.set(
            screenWidth / 2 - (bounds.x + bounds.width / 2) * scale,
            screenHeight / 2 - (bounds.y + bounds.height / 2) * scale,
          );
        };

        fitRef.current = fit;
        stageRef.current = { app, world, handle: null, fit };

        const tick = () => {
          if (!app) return;
          const handle = handleRef.current;
          if (!handle) return;

          const state = useViewerStore.getState();
          const rawDelta = Math.min(app.ticker.deltaMS / 1000, 0.1);

          if (!state.timelineMode) {
            handle.update(rawDelta);
            return;
          }

          if (!state.timelinePlaying) return;

          const layout = getTimelineLayout(state.timeline);
          if (layout.total <= 0) {
            state.pauseTimeline();
            return;
          }

          const timeDelta = rawDelta * state.speed;
          let nextTime = timelineTimeRef.current + timeDelta;
          let reachedEnd = false;
          let wrapped = false;

          if (nextTime >= layout.total) {
            if (state.loop) {
              nextTime = nextTime % layout.total;
              wrapped = true;
            } else {
              nextTime = layout.total;
              reachedEnd = true;
            }
          }

          timelineTimeRef.current = nextTime;
          const moment = getTimelineMoment(layout, nextTime);
          if (!moment) {
            state.pauseTimeline();
            return;
          }

          const clipId = moment.segment.clip.id;
          if (wrapped || clipId !== timelineClipIdRef.current) {
            applyTimelineAt(nextTime);
            timelineClipIdRef.current = clipId;
          } else {
            handle.update(rawDelta);
          }

          const now = performance.now();
          if (
            reachedEnd ||
            now - lastTimelinePublishRef.current > 80
          ) {
            state.setTimelineProgress(nextTime, clipId);
            lastTimelinePublishRef.current = now;
          }

          if (reachedEnd) {
            state.pauseTimeline();
          }
        };
        app.ticker.add(tick);

        fpsInterval = setInterval(() => {
          if (!app) return;
          setFps(Math.round(app.ticker.FPS));
        }, 500);

        resizeObserver = new ResizeObserver(() => {
          if (!app) return;
          const nextWidth = Math.max(1, container.clientWidth);
          const nextHeight = Math.max(1, container.clientHeight);
          app.renderer.resize(nextWidth, nextHeight);
          fitRef.current?.();
        });
        resizeObserver.observe(container);

        let draggingNow = false;
        let lastX = 0;
        let lastY = 0;
        let pointerId: number | null = null;

        const getWorld = () => stageRef.current?.world ?? null;

        const onPointerDown = (event: PointerEvent) => {
          if (event.button !== 0) return;
          const currentWorld = getWorld();
          const currentHandle = handleRef.current;
          if (!currentWorld || !currentHandle) return;
          draggingNow = true;
          pointerId = event.pointerId;
          lastX = event.clientX;
          lastY = event.clientY;
          container.setPointerCapture(event.pointerId);
          setDragging(true);
        };

        const onPointerMove = (event: PointerEvent) => {
          if (!draggingNow) return;
          const currentWorld = getWorld();
          if (!currentWorld) return;
          currentWorld.x += event.clientX - lastX;
          currentWorld.y += event.clientY - lastY;
          lastX = event.clientX;
          lastY = event.clientY;
        };

        const endDrag = (event: PointerEvent) => {
          if (!draggingNow) return;
          draggingNow = false;
          if (pointerId !== null && container.hasPointerCapture(pointerId)) {
            container.releasePointerCapture(pointerId);
          }
          pointerId = null;
          setDragging(false);
          void event;
        };

        const onWheel = (event: WheelEvent) => {
          const currentWorld = getWorld();
          if (!currentWorld) return;
          event.preventDefault();
          const rect = container.getBoundingClientRect();
          const mouseX = event.clientX - rect.left;
          const mouseY = event.clientY - rect.top;
          const previousScale = currentWorld.scale.x;
          const factor = Math.exp(-event.deltaY * 0.0014);
          const nextScale = clamp(previousScale * factor, 0.04, 8);
          const localX = (mouseX - currentWorld.x) / previousScale;
          const localY = (mouseY - currentWorld.y) / previousScale;
          currentWorld.scale.set(nextScale);
          currentWorld.position.set(
            mouseX - localX * nextScale,
            mouseY - localY * nextScale,
          );
        };

        const onDoubleClick = () => fitRef.current?.();

        container.addEventListener("pointerdown", onPointerDown);
        container.addEventListener("pointermove", onPointerMove);
        container.addEventListener("pointerup", endDrag);
        container.addEventListener("pointercancel", endDrag);
        container.addEventListener("wheel", onWheel, { passive: false });
        container.addEventListener("dblclick", onDoubleClick);

        removeListeners = () => {
          container.removeEventListener("pointerdown", onPointerDown);
          container.removeEventListener("pointermove", onPointerMove);
          container.removeEventListener("pointerup", endDrag);
          container.removeEventListener("pointercancel", endDrag);
          container.removeEventListener("wheel", onWheel);
          container.removeEventListener("dblclick", onDoubleClick);
        };

        const { loadSpineCharacter } = await import("@/lib/spine/load-spine");
        const handle = await loadSpineCharacter(files);

        if (cancelled) {
          handle.destroy();
          return;
        }

        handleRef.current = handle;
        if (stageRef.current) stageRef.current.handle = handle;
        world.addChild(handle.object);

        const state = useViewerStore.getState();
        handle.setDebug(state.debug);
        handle.setSpeed(state.speed);
        handle.setLoop(state.loop);
        timelineTimeRef.current = 0;
        timelineClipIdRef.current = null;
        const defaultAnimation = pickDefaultAnimation(handle.animations);
        handle.play(defaultAnimation, state.loop);
        fitRef.current?.();
        setReady(true);

        loadSuccess({
          name: getSkeletonName(files),
          version: handle.version,
          animations: handle.animations,
        });
      } catch (error) {
        if (cancelled) return;
        console.error("[Spine Studio] Failed to load assets", error);
        loadFailure(
          error instanceof Error
            ? error.message
            : "The Spine assets could not be loaded.",
        );
      }
    };

    setReady(false);
    setFps(0);
    void boot();

    return () => {
      cancelled = true;
      cleanupStage();
    };
  }, [files, loadNonce, loadFailure, loadSuccess, applyTimelineAt]);

  useEffect(() => {
    const handle = handleRef.current;
    if (!handle || !ready || timelineMode) return;
    const state = useViewerStore.getState();
    handle.play(selectedAnimation, state.loop);
    handle.setPaused(!state.isPlaying);
  }, [selectedAnimation, playNonce, ready, timelineMode]);

  useEffect(() => {
    if (!ready || !timelineMode) return;
    const state = useViewerStore.getState();
    timelineTimeRef.current = state.timelineTime;
    const clipId = applyTimelineAt(state.timelineTime);
    timelineClipIdRef.current = clipId;
    state.setTimelineProgress(state.timelineTime, clipId);
  }, [ready, timelineMode, timelineSeekNonce, timeline, applyTimelineAt]);

  useEffect(() => {
    if (!ready || timelineMode) return;
    handleRef.current?.setLoop(loop);
  }, [loop, ready, timelineMode]);

  useEffect(() => {
    const handle = handleRef.current;
    if (!handle || !ready) return;
    handle.setPaused(timelineMode ? false : !isPlaying);
  }, [isPlaying, ready, timelineMode]);

  useEffect(() => {
    handleRef.current?.setSpeed(speed);
  }, [speed, ready]);

  useEffect(() => {
    handleRef.current?.setDebug(debug);
  }, [debug, ready]);

  useEffect(() => {
    if (!ready) return;
    fitRef.current?.();
  }, [fitNonce, ready]);

  const animation = character?.animations.find(
    (item) => item.name === selectedAnimation,
  );
  const timelineClip = timeline.find((clip) => clip.id === timelineActiveClipId);

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ backgroundColor }}
    >
      <div
        ref={containerRef}
        className={cn(
          "stage-grid absolute inset-0 touch-none select-none",
          dragging ? "cursor-grabbing" : "cursor-grab",
        )}
      />

      <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2">
        {showFps ? (
          <span className="rounded-md border border-white/10 bg-black/55 px-2.5 py-1 font-mono text-[10px] font-medium tracking-wide text-white/80 shadow-sm backdrop-blur-md">
            {fps > 0 ? fps : "—"} FPS
          </span>
        ) : null}
        {activeDebug ? (
          <span className="rounded-md border border-accent/30 bg-accent/15 px-2.5 py-1 font-mono text-[10px] font-medium tracking-wide text-accent shadow-sm backdrop-blur-md">
            DEBUG
          </span>
        ) : null}
        {timelineMode ? (
          <span className="flex items-center gap-1.5 rounded-md border border-white/10 bg-black/55 px-2.5 py-1 font-mono text-[10px] font-medium tracking-wide text-white/80 shadow-sm backdrop-blur-md">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                timelinePlaying
                  ? "animate-pulse-soft bg-accent"
                  : "bg-white/40",
              )}
            />
            SEQ
          </span>
        ) : null}
      </div>

      <div className="pointer-events-none absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
        <span className="rounded-md border border-white/10 bg-black/45 px-2.5 py-1 font-mono text-[10px] tracking-wide text-white/65 backdrop-blur-md">
          drag to pan · scroll to zoom · double-click to fit
        </span>
        {timelineMode ? (
          <span className="flex max-w-[50%] items-center gap-2 truncate rounded-md border border-white/10 bg-black/45 px-2.5 py-1 font-mono text-[10px] tracking-wide text-white/70 backdrop-blur-md">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            <span className="truncate">
              {timelineClip?.animation ?? "Sequence"}
            </span>
            {timelineClip ? (
              <span className="text-white/35">
                {formatDuration(timelineClip.duration)}
              </span>
            ) : null}
          </span>
        ) : animation ? (
          <span className="hidden max-w-[50%] items-center gap-2 truncate rounded-md border border-white/10 bg-black/45 px-2.5 py-1 font-mono text-[10px] tracking-wide text-white/70 backdrop-blur-md sm:flex">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            <span className="truncate">{animation.name}</span>
            <span className="text-white/35">{formatDuration(animation.duration)}</span>
          </span>
        ) : null}
      </div>
    </div>
  );
}
