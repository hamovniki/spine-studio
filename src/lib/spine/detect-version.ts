import { fileExtension } from "@/lib/utils";
import type { SpineVersionInfo } from "./types";

const VERSION_RE = /(\d+)\.(\d+)\.(\d+)/;

export class SpineVersionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SpineVersionError";
  }
}

export function parseSpineVersion(raw: string): SpineVersionInfo {
  const match = raw.match(VERSION_RE);
  if (!match) {
    throw new SpineVersionError(
      `Could not read a Spine version from "${raw || "unknown"}".`,
    );
  }

  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]);

  if (major === 3 && minor === 8) {
    return {
      raw,
      major,
      minor,
      patch,
      runtime: "spine-3.8",
      runtimeLabel: "pixi-spine 3.8",
      supported: true,
    };
  }

  if (major === 4 && minor === 2) {
    return {
      raw,
      major,
      minor,
      patch,
      runtime: "spine-4.2",
      runtimeLabel: "spine-pixi-v7 4.2",
      supported: true,
    };
  }

  if (major === 4 && minor >= 3) {
    return {
      raw,
      major,
      minor,
      patch,
      runtime: "spine-4.3",
      runtimeLabel: "spine-pixi-v7 4.3",
      supported: true,
    };
  }

  return {
    raw,
    major,
    minor,
    patch,
    runtime: null,
    runtimeLabel: `Spine ${major}.${minor}`,
    supported: false,
  };
}

export async function detectSpineVersion(file: File): Promise<SpineVersionInfo> {
  const extension = fileExtension(file.name);

  if (extension === ".json") {
    const text = await file.text();
    let data: unknown;
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      throw new SpineVersionError(
        `"${file.name}" is not valid JSON. Export the skeleton as JSON or binary .skel.`,
      );
    }

    const record = data as
      | {
          skeleton?: { spine?: string };
          spine?: string;
        }
      | null;
    const raw = record?.skeleton?.spine ?? record?.spine;

    if (!raw) {
      throw new SpineVersionError(
        `"${file.name}" does not look like a Spine skeleton. Expected a "skeleton.spine" field.`,
      );
    }

    return parseSpineVersion(raw);
  }

  if (extension === ".skel") {
    const buffer = await file.arrayBuffer();
    const header = new Uint8Array(buffer.slice(0, Math.min(buffer.byteLength, 8192)));
    const ascii = new TextDecoder("latin1").decode(header);
    const candidates = [...ascii.matchAll(/([34])\.(\d{1,2})\.(\d{1,3})/g)];
    const raw = candidates[0]?.[0];

    if (!raw) {
      throw new SpineVersionError(
        `Could not detect the Spine version inside "${file.name}".`,
      );
    }

    return parseSpineVersion(raw);
  }

  throw new SpineVersionError(
    `"${file.name}" is not a supported skeleton file. Use .json or .skel.`,
  );
}

export function assertSupportedVersion(
  version: SpineVersionInfo,
): asserts version is SpineVersionInfo & {
  runtime: NonNullable<SpineVersionInfo["runtime"]>;
} {
  if (!version.supported || !version.runtime) {
    throw new SpineVersionError(
      `Spine ${version.raw} is not supported by the installed runtimes. Use a Spine 3.8, 4.2, or 4.3+ export.`,
    );
  }
}
