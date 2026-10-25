"use client";

import {
  AlertTriangle,
  ArrowRight,
  Check,
  FileJson,
  FileText,
  Image as ImageIcon,
  LockKeyhole,
  Sparkles,
  Upload,
} from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { cn, fileExtension } from "@/lib/utils";

const ACCEPTED_EXTENSIONS = new Set([".png", ".json", ".atlas", ".skel"]);
const MAX_FILE_SIZE = 100 * 1024 * 1024;

function validateExtension(file: File): { code: string; message: string } | null {
  if (!ACCEPTED_EXTENSIONS.has(fileExtension(file.name))) {
    return {
      code: "file-invalid-type",
      message: `"${file.name}" is not a supported file. Use PNG, JSON, ATLAS, or SKEL.`,
    };
  }
  return null;
}

function rejectionMessage(rejections: FileRejection[]): string {
  const first = rejections[0];
  if (!first) return "Those files could not be added.";
  return first.errors[0]?.message ?? `"${first.file.name}" could not be added.`;
}

export function Dropzone({
  onFiles,
}: {
  onFiles: (files: File[]) => void;
}) {
  const [localError, setLocalError] = useState<string | null>(null);

  const onDropAccepted = useCallback(
    (accepted: File[]) => {
      const extensions = accepted.map((file) => fileExtension(file.name));
      const missing: string[] = [];

      if (!extensions.some((ext) => ext === ".json" || ext === ".skel")) {
        missing.push("one .json or .skel skeleton");
      }
      if (!extensions.includes(".atlas")) {
        missing.push("one .atlas file");
      }
      if (!extensions.includes(".png")) {
        missing.push("at least one .png page");
      }

      if (missing.length > 0) {
        setLocalError(
          `This export is incomplete. Include ${missing.join(", ")} in the same drop.`,
        );
        return;
      }

      setLocalError(null);
      onFiles(accepted);
    },
    [onFiles],
  );

  const onDropRejected = useCallback((rejections: FileRejection[]) => {
    setLocalError(rejectionMessage(rejections));
  }, []);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
  } = useDropzone({
    onDropAccepted,
    onDropRejected,
    multiple: true,
    maxSize: MAX_FILE_SIZE,
    validator: validateExtension,
  });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col justify-center px-4 py-8 sm:px-8 sm:py-12">
      <div className="animate-fade-up text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-muted backdrop-blur">
          <Sparkles className="h-3 w-3 text-accent" />
          Local Spine workspace
        </span>

        <h1 className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-foreground sm:text-5xl lg:text-6xl">
          Drop in a skeleton.
          <br />
          <span className="text-accent">See it move.</span>
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-pretty text-sm leading-6 text-muted sm:text-base">
          A focused viewer and debugger for Spine exports. Inspect animations,
          tune overlays, and build a timeline — all without uploading a byte.
        </p>
      </div>

      <div className="animate-scale-in mx-auto mt-8 w-full max-w-3xl [animation-delay:80ms]">
        <div className="rounded-[26px] border border-border bg-surface-raised p-1.5 shadow-[0_24px_70px_-30px_rgba(var(--shadow-color),0.45)]">
          <div
            {...getRootProps({
              className: cn(
                "group relative flex min-h-[260px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[20px] border border-dashed px-6 py-10 text-center transition-all duration-200 sm:min-h-[280px]",
                isDragActive
                  ? "border-accent bg-accent-soft"
                  : "border-border-strong bg-panel/50 hover:border-accent/60 hover:bg-panel",
                isDragReject && "border-danger bg-danger-soft",
              ),
            })}
          >
            <input {...getInputProps()} />
            <div
              className={cn(
                "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100",
                isDragActive && "opacity-100",
              )}
              style={{
                background:
                  "radial-gradient(50% 60% at 50% 0%, var(--accent-soft), transparent 70%)",
              }}
            />

            <div
              className={cn(
                "relative flex h-14 w-14 items-center justify-center rounded-2xl border transition-all duration-300",
                isDragActive
                  ? "scale-105 border-accent/40 bg-accent text-accent-foreground"
                  : "border-border bg-surface-raised text-muted-strong group-hover:-translate-y-0.5 group-hover:border-accent/30 group-hover:text-accent",
              )}
            >
              <Upload className="h-6 w-6" />
            </div>

            <h2 className="relative mt-5 text-lg font-medium tracking-[-0.01em] text-foreground">
              {isDragActive
                ? isDragReject
                  ? "Some files are not supported"
                  : "Release to load your character"
                : "Drag & drop your Spine export"}
            </h2>
            <p className="relative mt-1.5 max-w-sm text-xs leading-5 text-muted">
              Include the skeleton, atlas, and every texture page from the same
              export.
            </p>

            <span className="relative mt-5 inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-surface-raised px-3.5 text-xs font-medium text-foreground shadow-sm transition-colors group-hover:border-border-strong">
              Browse files
              <ArrowRight className="h-3.5 w-3.5 text-muted" />
            </span>

            <div className="relative mt-6 flex flex-wrap items-center justify-center gap-1.5">
              {[
                { label: ".PNG", icon: ImageIcon },
                { label: ".JSON", icon: FileJson },
                { label: ".ATLAS", icon: FileText },
                { label: ".SKEL", icon: FileText },
              ].map(({ label, icon: Icon }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-raised px-2 py-1 font-mono text-[9px] font-medium tracking-wide text-muted"
                >
                  <Icon className="h-2.5 w-2.5" />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {localError ? (
          <div
            role="alert"
            className="animate-fade-in mt-3 flex items-start gap-2.5 rounded-xl border border-danger/40 bg-danger-soft px-4 py-3 text-left text-xs leading-5 text-danger"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="font-medium">{localError}</span>
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-accent" />
            Spine 3.8 · 4.2 · 4.3+
          </span>
          <span className="inline-flex items-center gap-1.5">
            <LockKeyhole className="h-3.5 w-3.5 text-accent" />
            Renders entirely in your browser
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Version-aware runtimes
          </span>
        </div>

        <div className="mt-6 grid gap-2 sm:grid-cols-3">
          {[
            {
              title: "Inspect",
              copy: "Scrub animations, draw bones and meshes.",
            },
            {
              title: "Tune",
              copy: "Adjust the stage, speed, and playback loop.",
            },
            {
              title: "Compose",
              copy: "Sketch a sequence in the timeline builder.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-border bg-surface/60 px-3.5 py-3 backdrop-blur-sm"
            >
              <p className="text-[11px] font-medium text-foreground">
                {item.title}
              </p>
              <p className="mt-0.5 text-[11px] leading-4 text-muted">
                {item.copy}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
