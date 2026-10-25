"use client";

import { FileJson, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { fileExtension, formatFileSize } from "@/lib/utils";

function FileTypeIcon({ name }: { name: string }) {
  const extension = fileExtension(name);
  if (extension === ".json" || extension === ".skel") {
    return <FileJson className="h-3.5 w-3.5" />;
  }
  if (extension === ".atlas") return <FileText className="h-3.5 w-3.5" />;
  return <ImageIcon className="h-3.5 w-3.5" />;
}

export function LoadingOverlay({ files }: { files: File[] }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/82 p-6 backdrop-blur-md">
      <div className="animate-scale-in w-full max-w-md rounded-2xl border border-border bg-surface-raised p-5 shadow-[0_30px_80px_-30px_rgba(var(--shadow-color),0.6)]">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent/20 bg-accent-soft text-accent">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Building your character
            </p>
            <p className="mt-1 text-xs leading-5 text-muted">
              Detecting the Spine version, loading the matching runtime, and
              decoding texture pages.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-1.5">
          {files.map((file) => (
            <div
              key={`${file.name}-${file.size}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-panel/60 px-2.5 py-2"
            >
              <span className="flex min-w-0 items-center gap-2 text-[11px] text-muted-strong">
                <span className="text-muted">
                  <FileTypeIcon name={file.name} />
                </span>
                <span className="truncate">{file.name}</span>
              </span>
              <span className="shrink-0 font-mono text-[9px] text-muted">
                {formatFileSize(file.size)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <span className="h-1 flex-1 overflow-hidden rounded-full bg-panel">
            <span className="animate-pulse-soft block h-full w-2/3 rounded-full bg-accent" />
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
            parsing
          </span>
        </div>
      </div>
    </div>
  );
}
