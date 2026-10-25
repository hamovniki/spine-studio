"use client";

import {
  FolderOpen,
  Gauge,
  Image as ImageIcon,
  Palette,
  RefreshCw,
  FileJson,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn, fileExtension, formatFileSize } from "@/lib/utils";
import { useViewerStore } from "@/store/viewer-store";

const BACKGROUNDS = [
  { name: "Midnight", value: "#0b0f14" },
  { name: "Graphite", value: "#17191c" },
  { name: "Slate", value: "#111827" },
  { name: "Forest", value: "#132018" },
  { name: "Paper", value: "#f0f0e8" },
  { name: "Bone", value: "#e7dfcf" },
];

function AssetIcon({ name }: { name: string }) {
  const extension = fileExtension(name);
  if (extension === ".json" || extension === ".skel") {
    return <FileJson className="h-3.5 w-3.5" />;
  }
  if (extension === ".atlas") return <FileText className="h-3.5 w-3.5" />;
  return <ImageIcon className="h-3.5 w-3.5" />;
}

export function SettingsTab() {
  const backgroundColor = useViewerStore((state) => state.backgroundColor);
  const setBackgroundColor = useViewerStore(
    (state) => state.setBackgroundColor,
  );
  const showFps = useViewerStore((state) => state.showFps);
  const setShowFps = useViewerStore((state) => state.setShowFps);
  const files = useViewerStore((state) => state.files);
  const character = useViewerStore((state) => state.character);
  const reset = useViewerStore((state) => state.reset);

  return (
    <div className="space-y-5 p-3">
      <section>
        <div className="flex items-center gap-1.5">
          <Palette className="h-3.5 w-3.5 text-muted" />
          <h3 className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
            Canvas
          </h3>
        </div>

        <div className="mt-2 rounded-xl border border-border bg-panel/45 p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-foreground">
              Background
            </span>
            <label className="relative flex h-7 w-9 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-border bg-surface-raised">
              <input
                type="color"
                value={backgroundColor}
                onChange={(event) => setBackgroundColor(event.target.value)}
                aria-label="Custom canvas background color"
                className="absolute -inset-2 h-[calc(100%+16px)] w-[calc(100%+16px)] cursor-pointer border-0 bg-transparent p-0"
              />
              <span
                className="pointer-events-none h-4 w-5 rounded-sm border border-black/20"
                style={{ backgroundColor }}
              />
            </label>
          </div>

          <div className="mt-2.5 grid grid-cols-6 gap-1.5">
            {BACKGROUNDS.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => setBackgroundColor(color.value)}
                title={color.name}
                aria-label={`Set background to ${color.name}`}
                aria-pressed={backgroundColor === color.value}
                className={cn(
                  "h-7 rounded-md border transition-transform hover:scale-105",
                  backgroundColor === color.value
                    ? "border-accent ring-2 ring-accent/25 ring-offset-1 ring-offset-panel"
                    : "border-black/20",
                )}
                style={{ backgroundColor: color.value }}
              />
            ))}
          </div>

          <div className="mt-2 flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase text-muted">
              {backgroundColor}
            </span>
            <span className="font-mono text-[9px] text-muted">hex</span>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
            <div className="flex items-center gap-2">
              <Gauge className="h-3.5 w-3.5 text-muted" />
              <div>
                <p className="text-[11px] font-medium text-foreground">Show FPS</p>
                <p className="text-[10px] leading-4 text-muted">
                  Frame rate overlay
                </p>
              </div>
            </div>
            <Switch
              label="Show FPS"
              checked={showFps}
              onCheckedChange={setShowFps}
            />
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <FolderOpen className="h-3.5 w-3.5 text-muted" />
            <h3 className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
              Assets
            </h3>
          </div>
          <span className="font-mono text-[9px] text-muted">
            {files.length} files
          </span>
        </div>

        <div className="mt-2 space-y-1">
          {files.map((file) => (
            <div
              key={`${file.name}-${file.size}`}
              className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface-raised px-2.5 py-1.5"
            >
              <span className="flex min-w-0 items-center gap-2 text-[10px] text-muted-strong">
                <span className="text-muted">
                  <AssetIcon name={file.name} />
                </span>
                <span className="truncate">{file.name}</span>
              </span>
              <span className="shrink-0 font-mono text-[9px] text-muted">
                {formatFileSize(file.size)}
              </span>
            </div>
          ))}
        </div>

        <Button
          variant="secondary"
          size="sm"
          className="mt-2 w-full"
          onClick={reset}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Load different files
        </Button>
      </section>

      <section>
        <h3 className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
          Session
        </h3>
        <dl className="mt-2 divide-y divide-border overflow-hidden rounded-xl border border-border bg-panel/45 text-[10px]">
          <div className="flex items-center justify-between px-3 py-2">
            <dt className="text-muted">Skeleton</dt>
            <dd className="max-w-[170px] truncate font-mono text-muted-strong">
              {character?.name ?? "—"}
            </dd>
          </div>
          <div className="flex items-center justify-between px-3 py-2">
            <dt className="text-muted">Spine version</dt>
            <dd className="font-mono text-muted-strong">
              {character?.version.raw ?? "—"}
            </dd>
          </div>
          <div className="flex items-center justify-between px-3 py-2">
            <dt className="text-muted">Runtime</dt>
            <dd className="font-mono text-accent">
              {character?.version.runtimeLabel ?? "—"}
            </dd>
          </div>
          <div className="flex items-center justify-between px-3 py-2">
            <dt className="text-muted">Renderer</dt>
            <dd className="font-mono text-muted-strong">PixiJS 7 · WebGL</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
