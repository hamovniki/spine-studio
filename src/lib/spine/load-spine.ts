import { fileExtension } from "@/lib/utils";
import {
  assertSupportedVersion,
  detectSpineVersion,
  SpineVersionError,
} from "./detect-version";
import type {
  AnimationInfo,
  Bounds,
  DebugOptions,
  SpineHandle,
  SpineVersionInfo,
} from "./types";

type Spine38Module = typeof import("@pixi-spine/runtime-3.8");
type Spine38BaseModule = typeof import("@pixi-spine/base");
type OfficialModule = typeof import("@esotericsoftware/spine-pixi-v7");

interface LoadContext {
  version: SpineVersionInfo;
  skeletonFile: File;
  skeletonText: string;
  skeletonBytes: Uint8Array;
  atlasText: string;
  baseTextures: Map<string, import("pixi.js").BaseTexture>;
}

const MAX_FRAME_DELTA = 0.1;

function normalizePageName(name: string): string {
  try {
    return decodeURIComponent(name)
      .replaceAll("\\", "/")
      .split("/")
      .pop()!
      .toLowerCase();
  } catch {
    return name.replaceAll("\\", "/").split("/").pop()!.toLowerCase();
  }
}

function resolvePageTexture(
  pageName: string,
  ctx: LoadContext,
): import("pixi.js").BaseTexture {
  const normalized = normalizePageName(pageName);
  const direct = ctx.baseTextures.get(normalized);
  if (direct) return direct;

  const withoutExtension = normalized.replace(/\.[^.]+$/, "");
  for (const [name, texture] of ctx.baseTextures) {
    if (name.replace(/\.[^.]+$/, "") === withoutExtension) {
      return texture;
    }
  }

  if (ctx.baseTextures.size === 1) {
    return [...ctx.baseTextures.values()][0];
  }

  throw new Error(
    `The atlas references "${pageName}", but no uploaded PNG matches that page name.`,
  );
}

function setupPose(skeleton: unknown): void {
  const target = skeleton as {
    setupPose?: () => void;
    setToSetupPose?: () => void;
    setBonesToSetupPose?: () => void;
    setSlotsToSetupPose?: () => void;
  };

  if (typeof target.setupPose === "function") {
    target.setupPose();
    return;
  }
  if (typeof target.setToSetupPose === "function") {
    target.setToSetupPose();
    return;
  }
  target.setBonesToSetupPose?.();
  target.setSlotsToSetupPose?.();
}

function destroyBaseTextures(baseTextures: Map<string, import("pixi.js").BaseTexture>) {
  for (const texture of baseTextures.values()) {
    try {
      if (!texture.destroyed) texture.destroy();
    } catch {
      // Texture cleanup should never block a new load.
    }
  }
  baseTextures.clear();
}

function animationsFromData(
  data: { animations: Array<{ name: string; duration: number }> },
): AnimationInfo[] {
  return data.animations.map((animation) => ({
    name: animation.name,
    duration: animation.duration,
  }));
}

function getObjectBounds(object: import("pixi.js").Container): Bounds | null {
  try {
    object.updateTransform();
    const bounds = object.getLocalBounds();
    if (!bounds || bounds.width <= 0 || bounds.height <= 0) return null;
    return {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    };
  } catch {
    return null;
  }
}

function applyDebugOptions(
  renderer: {
    drawBones?: boolean;
    drawMeshHull?: boolean;
    drawMeshTriangles?: boolean;
    drawPaths?: boolean;
    drawBoundingBoxes?: boolean;
    drawRegionAttachments?: boolean;
    drawClipping?: boolean;
    drawDebug?: boolean;
  },
  options: DebugOptions,
) {
  if (typeof renderer.drawDebug === "boolean") renderer.drawDebug = true;
  renderer.drawBones = options.bones;
  renderer.drawMeshHull = options.mesh;
  renderer.drawMeshTriangles = options.mesh;
  renderer.drawPaths = options.paths;
  renderer.drawBoundingBoxes = options.boundingBoxes;
  renderer.drawRegionAttachments = options.regions;
  renderer.drawClipping = false;
}

async function loadWithPixiSpine(ctx: LoadContext): Promise<SpineHandle> {
  const [runtime, base] = await Promise.all([
    import("@pixi-spine/runtime-3.8") as Promise<Spine38Module>,
    import("@pixi-spine/base") as Promise<Spine38BaseModule>,
  ]);

  const {
    AtlasAttachmentLoader,
    SkeletonBinary,
    SkeletonJson,
    Spine,
  } = runtime;
  const { SpineDebugRenderer, TextureAtlas } = base;

  const atlas = new TextureAtlas(ctx.atlasText, (path, callback) => {
    callback(resolvePageTexture(path, ctx));
  });
  const attachmentLoader = new AtlasAttachmentLoader(atlas);
  const isJson = fileExtension(ctx.skeletonFile.name) === ".json";
  const parser = isJson
    ? new SkeletonJson(attachmentLoader)
    : new SkeletonBinary(attachmentLoader);
  const data = isJson
    ? (parser as InstanceType<typeof SkeletonJson>).readSkeletonData(
        ctx.skeletonText,
      )
    : (parser as InstanceType<typeof SkeletonBinary>).readSkeletonData(
        ctx.skeletonBytes,
      );

  const spine = new Spine(data);
  spine.autoUpdate = false;

  const debug = new SpineDebugRenderer();
  let currentEntry: ReturnType<typeof spine.state.setAnimation> | null = null;
  let currentName: string | null = null;
  let currentLoop = true;
  let paused = false;
  let speed = 1;
  applyDebugOptions(debug, {
    bones: false,
    mesh: false,
    paths: false,
    boundingBoxes: false,
    regions: false,
  });
  spine.debug = debug;

  const setDebug = (options: DebugOptions) => {
    applyDebugOptions(debug, options);
  };

  const play = (name: string | null, loop: boolean, startTime = 0) => {
    spine.state.clearTracks();
    setupPose(spine.skeleton);
    currentName = name;
    currentLoop = loop;

    if (!name) {
      currentEntry = null;
      spine.update(0);
      return;
    }

    currentEntry = spine.state.setAnimation(0, name, loop);
    const offset = Math.max(0, startTime);
    if (offset > 0) {
      currentEntry.trackTime = offset;
      currentEntry.animationLast = offset;
    }
    spine.update(0);
  };

  const handle: SpineHandle = {
    object: spine,
    animations: animationsFromData(data),
    version: ctx.version,
    play,
    setPaused(value) {
      paused = value;
    },
    setSpeed(value) {
      speed = value;
    },
    setLoop(loop) {
      currentLoop = loop;
      if (currentEntry) currentEntry.loop = loop;
    },
    restart() {
      if (currentName) play(currentName, currentLoop);
    },
    setDebug,
    update(deltaSeconds) {
      if (paused) return;
      spine.update(
        Math.min(Math.max(deltaSeconds, 0), MAX_FRAME_DELTA) * speed,
      );
    },
    getBounds() {
      return getObjectBounds(spine);
    },
    destroy() {
      try {
        (spine as unknown as { debug?: unknown }).debug = undefined;
        spine.destroy({ children: true, texture: false, baseTexture: false });
      } catch {
        // Ignore duplicate destruction from React strict mode.
      }
      destroyBaseTextures(ctx.baseTextures);
    },
  };

  return handle;
}

async function loadWithOfficialRuntime(
  ctx: LoadContext,
  runtimePromise: Promise<OfficialModule>,
): Promise<SpineHandle> {
  const {
    AtlasAttachmentLoader,
    SkeletonBinary,
    SkeletonJson,
    Spine,
    SpineDebugRenderer,
    SpineTexture,
    TextureAtlas,
  } = await runtimePromise;

  const atlas = new TextureAtlas(ctx.atlasText);
  for (const page of atlas.pages) {
    const baseTexture = resolvePageTexture(page.name, ctx);
    page.setTexture(SpineTexture.from(baseTexture));
  }

  const attachmentLoader = new AtlasAttachmentLoader(atlas);
  const isJson = fileExtension(ctx.skeletonFile.name) === ".json";
  const parser = isJson
    ? new SkeletonJson(attachmentLoader)
    : new SkeletonBinary(attachmentLoader);
  const data = isJson
    ? (parser as InstanceType<typeof SkeletonJson>).readSkeletonData(
        ctx.skeletonText,
      )
    : (parser as InstanceType<typeof SkeletonBinary>).readSkeletonData(
        ctx.skeletonBytes,
      );

  const spine = new Spine({ skeletonData: data, autoUpdate: false });
  const debug = new SpineDebugRenderer();
  let currentEntry: ReturnType<typeof spine.state.setAnimation> | null = null;
  let currentName: string | null = null;
  let currentLoop = true;
  let paused = false;
  let speed = 1;
  applyDebugOptions(debug, {
    bones: false,
    mesh: false,
    paths: false,
    boundingBoxes: false,
    regions: false,
  });
  spine.debug = debug;

  const setDebug = (options: DebugOptions) => {
    applyDebugOptions(debug, options);
  };

  const play = (name: string | null, loop: boolean, startTime = 0) => {
    spine.state.clearTracks();
    setupPose(spine.skeleton);
    currentName = name;
    currentLoop = loop;

    if (!name) {
      currentEntry = null;
      spine.update(0);
      return;
    }

    currentEntry = spine.state.setAnimation(0, name, loop);
    const offset = Math.max(0, startTime);
    if (offset > 0) {
      currentEntry.trackTime = offset;
      currentEntry.animationLast = offset;
    }
    spine.update(0);
  };

  const handle: SpineHandle = {
    object: spine,
    animations: animationsFromData(data),
    version: ctx.version,
    play,
    setPaused(value) {
      paused = value;
    },
    setSpeed(value) {
      speed = value;
    },
    setLoop(loop) {
      currentLoop = loop;
      if (currentEntry) currentEntry.loop = loop;
    },
    restart() {
      if (currentName) play(currentName, currentLoop);
    },
    setDebug,
    update(deltaSeconds) {
      if (paused) return;
      spine.update(
        Math.min(Math.max(deltaSeconds, 0), MAX_FRAME_DELTA) * speed,
      );
    },
    getBounds() {
      return getObjectBounds(spine);
    },
    destroy() {
      try {
        spine.debug = undefined;
        spine.destroy({ children: true, texture: false, baseTexture: false });
      } catch {
        // Ignore duplicate destruction from React strict mode.
      }
      try {
        atlas.dispose();
      } catch {
        // The atlas may already be released by spine.destroy.
      }
      destroyBaseTextures(ctx.baseTextures);
    },
  };

  return handle;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("A PNG page could not be decoded by the browser."));
    image.src = url;
  });
}

export async function loadSpineCharacter(files: File[]): Promise<SpineHandle> {
  const skeletonFiles = files.filter((file) => {
    const extension = fileExtension(file.name);
    return extension === ".json" || extension === ".skel";
  });
  const atlasFiles = files.filter(
    (file) => fileExtension(file.name) === ".atlas",
  );
  const imageFiles = files.filter(
    (file) => fileExtension(file.name) === ".png",
  );

  if (skeletonFiles.length === 0) {
    throw new SpineVersionError(
      "A skeleton file is missing. Add one .json or .skel export.",
    );
  }
  if (skeletonFiles.length > 1) {
    throw new SpineVersionError(
      "Multiple skeleton files were dropped. Add only one .json or .skel skeleton per load.",
    );
  }
  if (atlasFiles.length === 0) {
    throw new SpineVersionError(
      "An atlas file is missing. Add the .atlas file from the same export.",
    );
  }
  if (atlasFiles.length > 1) {
    throw new SpineVersionError(
      "Multiple atlas files were dropped. Add only one .atlas file per load.",
    );
  }
  if (imageFiles.length === 0) {
    throw new SpineVersionError(
      "At least one PNG texture page is required. Add every PNG from the export.",
    );
  }

  const skeletonFile = skeletonFiles[0];
  const atlasFile = atlasFiles[0];
  const version = await detectSpineVersion(skeletonFile);
  assertSupportedVersion(version);

  const [skeletonText, skeletonBytes, atlasText] = await Promise.all([
    skeletonFile.text(),
    skeletonFile.arrayBuffer().then((buffer) => new Uint8Array(buffer)),
    atlasFile.text(),
  ]);

  const pixi = await import("pixi.js");
  const baseTextures = new Map<string, import("pixi.js").BaseTexture>();
  const objectUrls: string[] = [];

  try {
    const images = await Promise.all(
      imageFiles.map(async (file) => {
        const url = URL.createObjectURL(file);
        objectUrls.push(url);
        try {
          const image = await loadImage(url);
          return { file, image };
        } catch (error) {
          throw new Error(
            error instanceof Error
              ? `${file.name}: ${error.message}`
              : `${file.name} could not be loaded.`,
          );
        }
      }),
    );

    for (const { file, image } of images) {
      const texture = pixi.BaseTexture.from(image, {
        scaleMode: pixi.SCALE_MODES.LINEAR,
      });
      baseTextures.set(file.name.toLowerCase(), texture);
    }

    const ctx: LoadContext = {
      version,
      skeletonFile,
      skeletonText,
      skeletonBytes,
      atlasText,
      baseTextures,
    };

    if (version.runtime === "spine-3.8") {
      return await loadWithPixiSpine(ctx);
    }

    if (version.runtime === "spine-4.2") {
      const runtime = import(
        "@spine-runtime/spine-pixi-v7-42"
      ) as unknown as Promise<OfficialModule>;
      return await loadWithOfficialRuntime(ctx, runtime);
    }

    const runtime = import(
      "@esotericsoftware/spine-pixi-v7"
    ) as Promise<OfficialModule>;
    return await loadWithOfficialRuntime(ctx, runtime);
  } catch (error) {
    destroyBaseTextures(baseTextures);
    if (error instanceof SpineVersionError) throw error;
    throw new Error(
      error instanceof Error
        ? error.message
        : "The Spine assets could not be loaded.",
    );
  } finally {
    for (const url of objectUrls) URL.revokeObjectURL(url);
  }
}
