"use client";

import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/sidebar/sidebar";
import { Dropzone } from "@/components/workspace/dropzone";
import { LoadErrorState } from "@/components/workspace/load-error-state";
import { LoadingOverlay } from "@/components/workspace/loading-overlay";
import { SpineStage } from "@/components/workspace/spine-stage";
import { ViewerToolbar } from "@/components/workspace/viewer-toolbar";
import { useViewerStore } from "@/store/viewer-store";

function ViewerPanel({
  files,
  loading,
}: {
  files: File[];
  loading: boolean;
}) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {!loading ? <ViewerToolbar /> : null}
      <div className="relative min-h-0 flex-1">
        <SpineStage files={files} />
        {loading ? <LoadingOverlay files={files} /> : null}
      </div>
    </div>
  );
}

export function SpineWorkspace() {
  const status = useViewerStore((state) => state.status);
  const files = useViewerStore((state) => state.files);
  const beginLoad = useViewerStore((state) => state.beginLoad);

  const showViewer = status === "loading" || status === "ready";

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <Header />

      <div className="relative flex min-h-0 flex-1 flex-col lg:flex-row">
        {status === "ready" ? (
          <div className="order-2 h-[44dvh] shrink-0 border-t border-border lg:order-1 lg:h-auto lg:border-t-0">
            <Sidebar />
          </div>
        ) : null}

        <main className="relative order-1 flex min-h-0 min-w-0 flex-1 flex-col lg:order-2">
          {status === "idle" ? (
            <div className="scrollbar-thin relative h-full overflow-y-auto">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(65% 55% at 50% -5%, var(--accent-soft), transparent 72%)",
                }}
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-[0.35]"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
                  backgroundSize: "56px 56px",
                  maskImage:
                    "radial-gradient(ellipse 70% 60% at 50% 30%, black, transparent 80%)",
                  WebkitMaskImage:
                    "radial-gradient(ellipse 70% 60% at 50% 30%, black, transparent 80%)",
                }}
              />
              <div className="relative flex min-h-full items-center justify-center">
                <Dropzone onFiles={beginLoad} />
              </div>
            </div>
          ) : null}

          {showViewer ? (
            <ViewerPanel files={files} loading={status === "loading"} />
          ) : null}

          {status === "error" ? <LoadErrorState /> : null}
        </main>
      </div>
    </div>
  );
}
