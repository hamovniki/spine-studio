export type SpineRuntimeId = "spine-3.8" | "spine-4.2" | "spine-4.3";

export interface SpineVersionInfo {
  raw: string;
  major: number;
  minor: number;
  patch: number;
  runtime: SpineRuntimeId | null;
  runtimeLabel: string;
  supported: boolean;
}

export interface AnimationInfo {
  name: string;
  duration: number;
}

export interface DebugOptions {
  bones: boolean;
  mesh: boolean;
  paths: boolean;
  boundingBoxes: boolean;
  regions: boolean;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CharacterInfo {
  name: string;
  version: SpineVersionInfo;
  animations: AnimationInfo[];
}

export interface SpineHandle {
  object: import("pixi.js").Container;
  animations: AnimationInfo[];
  version: SpineVersionInfo;
  play: (name: string | null, loop: boolean, startTime?: number) => void;
  setPaused: (paused: boolean) => void;
  setSpeed: (speed: number) => void;
  setLoop: (loop: boolean) => void;
  restart: () => void;
  setDebug: (options: DebugOptions) => void;
  update: (deltaSeconds: number) => void;
  getBounds: () => Bounds | null;
  destroy: () => void;
}
