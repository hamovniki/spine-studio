export interface TimelineClip {
  id: string;
  animation: string;
  duration: number;
  loop: boolean;
}

export interface TimelineSegment {
  clip: TimelineClip;
  start: number;
  end: number;
  effectiveDuration: number;
}

export interface TimelineLayout {
  segments: TimelineSegment[];
  total: number;
}

export interface TimelineMoment {
  segment: TimelineSegment;
  localTime: number;
}

const MIN_CLIP_DURATION = 0.01;
export const CLIP_REPEAT_COUNT = 2;

export function getTimelineLayout(clips: TimelineClip[]): TimelineLayout {
  let cursor = 0;
  const segments = clips.map((clip) => {
    const animationDuration = Math.max(clip.duration, MIN_CLIP_DURATION);
    const effectiveDuration =
      animationDuration * (clip.loop ? CLIP_REPEAT_COUNT : 1);
    const start = cursor;
    const end = start + effectiveDuration;
    cursor = end;
    return { clip, start, end, effectiveDuration };
  });

  return { segments, total: cursor };
}

export function getTimelineTotal(clips: TimelineClip[]): number {
  return getTimelineLayout(clips).total;
}

export function clampTimelineTime(time: number, total: number): number {
  if (!Number.isFinite(time) || time <= 0) return 0;
  if (time >= total) return total;
  return time;
}

export function getTimelineMoment(
  layout: TimelineLayout,
  time: number,
): TimelineMoment | null {
  if (layout.segments.length === 0 || layout.total <= 0) return null;

  const clamped = clampTimelineTime(time, layout.total);
  for (let index = 0; index < layout.segments.length; index += 1) {
    const segment = layout.segments[index];
    const isLast = index === layout.segments.length - 1;
    if (clamped < segment.end || isLast) {
      return {
        segment,
        localTime: Math.max(0, clamped - segment.start),
      };
    }
  }

  return null;
}
