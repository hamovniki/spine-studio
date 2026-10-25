import { create } from "zustand";
import {
  createId,
  fileExtension,
  pickDefaultAnimation,
  stripExtension,
} from "@/lib/utils";
import {
  clampTimelineTime,
  getTimelineLayout,
  getTimelineMoment,
  type TimelineClip,
} from "@/lib/timeline";
import type {
  AnimationInfo,
  CharacterInfo,
  DebugOptions,
} from "@/lib/spine/types";

export type { TimelineClip } from "@/lib/timeline";

export type SidebarTab = "animations" | "debug" | "timeline" | "settings";
export type LoadStatus = "idle" | "loading" | "ready" | "error";

const defaultDebug: DebugOptions = {
  bones: false,
  mesh: false,
  paths: false,
  boundingBoxes: false,
  regions: false,
};

interface ViewerState {
  files: File[];
  status: LoadStatus;
  error: string | null;
  character: CharacterInfo | null;
  selectedAnimation: string | null;
  isPlaying: boolean;
  loop: boolean;
  speed: number;
  sidebarTab: SidebarTab;
  debug: DebugOptions;
  backgroundColor: string;
  showFps: boolean;
  timeline: TimelineClip[];
  timelineMode: boolean;
  timelinePlaying: boolean;
  timelineTime: number;
  timelineActiveClipId: string | null;
  timelineSeekNonce: number;
  loadNonce: number;
  playNonce: number;
  fitNonce: number;

  beginLoad: (files: File[]) => void;
  loadSuccess: (character: CharacterInfo) => void;
  loadFailure: (message: string) => void;
  retryLoad: () => void;
  reset: () => void;

  setSidebarTab: (tab: SidebarTab) => void;
  selectAnimation: (name: string) => void;
  setPlaying: (playing: boolean) => void;
  togglePlaying: () => void;
  restart: () => void;
  setLoop: (loop: boolean) => void;
  setSpeed: (speed: number) => void;

  setDebug: (key: keyof DebugOptions, value: boolean) => void;
  resetDebug: () => void;

  setBackgroundColor: (color: string) => void;
  setShowFps: (show: boolean) => void;

  addTimelineClip: () => void;
  removeTimelineClip: (id: string) => void;
  toggleTimelineLoop: (id: string) => void;
  moveTimelineClip: (id: string, direction: -1 | 1) => void;
  clearTimeline: () => void;

  playTimeline: () => void;
  pauseTimeline: () => void;
  stopTimeline: () => void;
  restartTimeline: () => void;
  toggleTimeline: () => void;
  seekTimeline: (time: number) => void;
  setTimelineProgress: (time: number, activeClipId: string | null) => void;

  requestFit: () => void;
}

function firstAnimation(character: CharacterInfo | null): AnimationInfo | null {
  if (!character) return null;
  const name = pickDefaultAnimation(character.animations);
  return character.animations.find((animation) => animation.name === name) ?? null;
}

function timelineStateFor(timeline: TimelineClip[], time: number) {
  const layout = getTimelineLayout(timeline);
  const clamped = clampTimelineTime(time, layout.total);
  const moment = getTimelineMoment(layout, clamped);
  return {
    timelineTime: clamped,
    timelineActiveClipId: moment?.segment.clip.id ?? null,
  };
}

export const useViewerStore = create<ViewerState>()((set, get) => ({
  files: [],
  status: "idle",
  error: null,
  character: null,
  selectedAnimation: null,
  isPlaying: false,
  loop: true,
  speed: 1,
  sidebarTab: "animations",
  debug: { ...defaultDebug },
  backgroundColor: "#0b0f14",
  showFps: true,
  timeline: [],
  timelineMode: false,
  timelinePlaying: false,
  timelineTime: 0,
  timelineActiveClipId: null,
  timelineSeekNonce: 0,
  loadNonce: 0,
  playNonce: 0,
  fitNonce: 0,

  beginLoad: (files) =>
    set((state) => ({
      files,
      status: "loading",
      error: null,
      character: null,
      selectedAnimation: null,
      isPlaying: false,
      timeline: [],
      timelineMode: false,
      timelinePlaying: false,
      timelineTime: 0,
      timelineActiveClipId: null,
      timelineSeekNonce: 0,
      sidebarTab: "animations",
      loadNonce: state.loadNonce + 1,
    })),

  loadSuccess: (character) => {
    const animation = firstAnimation(character);
    set({
      character,
      status: "ready",
      error: null,
      selectedAnimation: animation?.name ?? null,
      isPlaying: Boolean(animation),
      timelineMode: false,
      timelinePlaying: false,
      timelineTime: 0,
      timelineActiveClipId: null,
      playNonce: get().playNonce + 1,
    });
  },

  loadFailure: (message) =>
    set({
      status: "error",
      error: message,
      isPlaying: false,
      timelinePlaying: false,
    }),

  retryLoad: () =>
    set((state) => ({
      status: "loading",
      error: null,
      character: null,
      selectedAnimation: null,
      isPlaying: false,
      timelineMode: false,
      timelinePlaying: false,
      timelineTime: 0,
      timelineActiveClipId: null,
      loadNonce: state.loadNonce + 1,
    })),

  reset: () =>
    set({
      files: [],
      status: "idle",
      error: null,
      character: null,
      selectedAnimation: null,
      isPlaying: false,
      timeline: [],
      timelineMode: false,
      timelinePlaying: false,
      timelineTime: 0,
      timelineActiveClipId: null,
      sidebarTab: "animations",
      debug: { ...defaultDebug },
      speed: 1,
      loop: true,
      playNonce: 0,
      fitNonce: 0,
    }),

  setSidebarTab: (sidebarTab) => set({ sidebarTab }),

  selectAnimation: (name) =>
    set((state) => ({
      selectedAnimation: name,
      isPlaying: true,
      timelineMode: false,
      timelinePlaying: false,
      timelineTime: 0,
      timelineActiveClipId: null,
      playNonce: state.playNonce + 1,
    })),

  setPlaying: (isPlaying) => set({ isPlaying }),
  togglePlaying: () =>
    set((state) => ({
      isPlaying: !state.isPlaying,
      timelineMode: false,
      timelinePlaying: false,
      timelineTime: 0,
      timelineActiveClipId: null,
    })),
  restart: () =>
    set((state) => ({
      isPlaying: true,
      timelineMode: false,
      timelinePlaying: false,
      timelineTime: 0,
      timelineActiveClipId: null,
      playNonce: state.playNonce + 1,
    })),
  setLoop: (loop) => set({ loop }),
  setSpeed: (speed) => set({ speed }),

  setDebug: (key, value) =>
    set((state) => ({ debug: { ...state.debug, [key]: value } })),
  resetDebug: () => set({ debug: { ...defaultDebug } }),

  setBackgroundColor: (backgroundColor) => set({ backgroundColor }),
  setShowFps: (showFps) => set({ showFps }),

  addTimelineClip: () => {
    const { selectedAnimation, character } = get();
    if (!selectedAnimation || !character) return;
    const animation = character.animations.find(
      (item) => item.name === selectedAnimation,
    );
    if (!animation) return;

    set((state) => {
      const timeline = [
        ...state.timeline,
        {
          id: createId(),
          animation: animation.name,
          duration: animation.duration,
          loop: false,
        },
      ];
      return {
        timeline,
        timelinePlaying: false,
        ...timelineStateFor(timeline, state.timelineTime),
        timelineSeekNonce: state.timelineMode
          ? state.timelineSeekNonce + 1
          : state.timelineSeekNonce,
      };
    });
  },

  removeTimelineClip: (id) =>
    set((state) => {
      const timeline = state.timeline.filter((clip) => clip.id !== id);
      if (timeline.length === 0) {
        return {
          timeline,
          timelineMode: false,
          timelinePlaying: false,
          timelineTime: 0,
          timelineActiveClipId: null,
        };
      }
      return {
        timeline,
        timelinePlaying: false,
        ...timelineStateFor(timeline, state.timelineTime),
        timelineSeekNonce: state.timelineMode
          ? state.timelineSeekNonce + 1
          : state.timelineSeekNonce,
      };
    }),

  toggleTimelineLoop: (id) =>
    set((state) => {
      const timeline = state.timeline.map((clip) =>
        clip.id === id ? { ...clip, loop: !clip.loop } : clip,
      );
      return {
        timeline,
        timelinePlaying: false,
        ...timelineStateFor(timeline, state.timelineTime),
        timelineSeekNonce: state.timelineMode
          ? state.timelineSeekNonce + 1
          : state.timelineSeekNonce,
      };
    }),

  moveTimelineClip: (id, direction) =>
    set((state) => {
      const index = state.timeline.findIndex((clip) => clip.id === id);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= state.timeline.length) {
        return state;
      }
      const timeline = [...state.timeline];
      const [clip] = timeline.splice(index, 1);
      timeline.splice(nextIndex, 0, clip);
      return {
        timeline,
        timelinePlaying: false,
        ...timelineStateFor(timeline, state.timelineTime),
        timelineSeekNonce: state.timelineMode
          ? state.timelineSeekNonce + 1
          : state.timelineSeekNonce,
      };
    }),

  clearTimeline: () =>
    set({
      timeline: [],
      timelineMode: false,
      timelinePlaying: false,
      timelineTime: 0,
      timelineActiveClipId: null,
    }),

  playTimeline: () =>
    set((state) => {
      const layout = getTimelineLayout(state.timeline);
      if (layout.total <= 0) return state;
      const atEnd = state.timelineTime >= layout.total - 0.001;
      const time =
        !state.timelineMode || atEnd
          ? 0
          : clampTimelineTime(state.timelineTime, layout.total);
      const moment = getTimelineMoment(layout, time);
      return {
        timelineMode: true,
        timelinePlaying: true,
        timelineTime: time,
        timelineActiveClipId: moment?.segment.clip.id ?? null,
        timelineSeekNonce: state.timelineSeekNonce + 1,
        isPlaying: false,
      };
    }),

  pauseTimeline: () => set({ timelinePlaying: false }),

  stopTimeline: () =>
    set((state) => {
      const layout = getTimelineLayout(state.timeline);
      const moment = getTimelineMoment(layout, 0);
      return {
        timelineMode: layout.segments.length > 0,
        timelinePlaying: false,
        timelineTime: 0,
        timelineActiveClipId: moment?.segment.clip.id ?? null,
        timelineSeekNonce: state.timelineSeekNonce + 1,
        isPlaying: false,
      };
    }),

  restartTimeline: () =>
    set((state) => {
      const layout = getTimelineLayout(state.timeline);
      if (layout.total <= 0) return state;
      const moment = getTimelineMoment(layout, 0);
      return {
        timelineMode: true,
        timelinePlaying: true,
        timelineTime: 0,
        timelineActiveClipId: moment?.segment.clip.id ?? null,
        timelineSeekNonce: state.timelineSeekNonce + 1,
        isPlaying: false,
      };
    }),

  toggleTimeline: () => {
    const state = get();
    if (state.timelineMode && state.timelinePlaying) {
      state.pauseTimeline();
    } else {
      state.playTimeline();
    }
  },

  seekTimeline: (time) =>
    set((state) => {
      const layout = getTimelineLayout(state.timeline);
      if (layout.total <= 0) return state;
      const clamped = clampTimelineTime(time, layout.total);
      const moment = getTimelineMoment(layout, clamped);
      return {
        timelineMode: true,
        timelineTime: clamped,
        timelineActiveClipId: moment?.segment.clip.id ?? null,
        timelineSeekNonce: state.timelineSeekNonce + 1,
        isPlaying: false,
      };
    }),

  setTimelineProgress: (time, activeClipId) =>
    set({ timelineTime: Math.max(0, time), timelineActiveClipId: activeClipId }),

  requestFit: () => set((state) => ({ fitNonce: state.fitNonce + 1 })),
}));

export function getFileSummary(files: File[]): {
  skeletons: File[];
  atlases: File[];
  images: File[];
  unknown: File[];
} {
  const skeletons: File[] = [];
  const atlases: File[] = [];
  const images: File[] = [];
  const unknown: File[] = [];
  for (const file of files) {
    const ext = fileExtension(file.name);
    if (ext === ".json" || ext === ".skel") skeletons.push(file);
    else if (ext === ".atlas") atlases.push(file);
    else if (ext === ".png") images.push(file);
    else unknown.push(file);
  }
  return { skeletons, atlases, images, unknown };
}

export function getSkeletonName(files: File[]): string {
  const skeleton = getFileSummary(files).skeletons[0];
  return skeleton ? stripExtension(skeleton.name) : "Untitled skeleton";
}
