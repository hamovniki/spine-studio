"use client";

import {
  AlertTriangle,
  FileJson,
  FileText,
  Image as ImageIcon,
  RefreshCw,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatFileSize, fileExtension } from "@/lib/utils";
import { useViewerStore } from "@/store/viewer-store";

function FileTypeIcon({ name }: { name: string }) {
  const extension = fileExtension(name);
  if (extension === ".json" || extension === ".skel") {
    return <FileJson className="h-3.5 w-3.5" />;
  }
  if (extension === ".atlas") return <FileText className="h-3.5 w-3.5" />;
  return <ImageIcon className="h-3.5 w-3.5" />;
}

export function LoadErrorState() {
  const files = useViewerStore((state) => state.files);
  const error = useViewerStore((state) => state.error);
  const retryLoad = useViewerStore((state) => state.retryLoad);
  const reset = useViewerStore((state) => state.reset);

  return (
    <div className="flex h-full w-full items-center justify-center overflow-y-auto p-4 sm:p-8">
      <div className="animate-scale-in w-full max-w-lg rounded-2xl border border-border bg-surface-raised p-5 shadow-[0_30px_80px_-35px_rgba(var(--shadow-color),0.55)] sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-danger/25 bg-danger-soft text-danger">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-medium tracking-[-0.01em] text-foreground">
              Couldn&apos;t build this character
            </h2>
            <p className="mt-1.5 text-xs leading-5 text-muted">
              {error ?? "The assets could not be read by the selected runtime."}
            </p>
          </div>
        </div>

        {files.length > 0 ? (
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
        ) : null}

        <div className="mt-5 rounded-xl border border-border bg-panel/60 px-3.5 py-3 text-[11px] leading-5 text-muted">
          <span className="font-medium text-muted-strong">Checklist:</span>{" "}
          one .json or .skel skeleton, one .atlas, and every .png page from the
          same export. Spine 3.8, 4.2, and 4.3+ are supported.
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={reset}>
            <Upload className="h-3.5 w-3.5" />
            Choose other files
          </Button>
          <Button variant="primary" size="sm" onClick={retryLoad}>
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
