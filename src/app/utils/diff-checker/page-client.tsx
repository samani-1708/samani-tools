"use client";

import { lazy, Suspense, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { useDiffStore } from "./store";
import { Toolbar } from "./components/toolbar";
import { InputPanel } from "./components/input-panel";

const SplitView = lazy(() =>
  import("./components/split-view").then((m) => ({ default: m.SplitView }))
);
const UnifiedView = lazy(() =>
  import("./components/unified-view").then((m) => ({ default: m.UnifiedView }))
);
const SettingsPanel = lazy(() =>
  import("./components/settings-panel").then((m) => ({
    default: m.SettingsPanel,
  }))
);
const ImageDiffViewer = lazy(() =>
  import("./components/image-diff-viewer").then((m) => ({
    default: m.ImageDiffViewer,
  }))
);
function LazyFallback() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );
}

function StatsBar() {
  const { diffResult, acceptedIds, rejectedIds } = useDiffStore();

  const stats = useMemo(() => {
    if (!diffResult) return null;
    let added = 0;
    let removed = 0;
    let unchanged = 0;

    for (const change of diffResult) {
      const lines =
        change.value.split("\n").length -
        (change.value.endsWith("\n") ? 1 : 0);
      if (change.type === "added") added += lines;
      else if (change.type === "removed") removed += lines;
      else unchanged += lines;
    }

    return {
      added,
      removed,
      unchanged,
      accepted: acceptedIds.size,
      rejected: rejectedIds.size,
    };
  }, [diffResult, acceptedIds, rejectedIds]);

  if (!stats) return null;

  return (
    <div className="flex items-center gap-4 px-4 py-2 text-xs border-t border-border bg-muted/40">
      <span className="text-green-600 font-medium">
        +{stats.added} additions
      </span>
      <span className="text-red-600 font-medium">
        -{stats.removed} removals
      </span>
      <span className="text-muted-foreground">{stats.unchanged} unchanged</span>
      {(stats.accepted > 0 || stats.rejected > 0) && (
        <>
          <span className="text-emerald-600">{stats.accepted} accepted</span>
          <span className="text-orange-600">{stats.rejected} rejected</span>
        </>
      )}
    </div>
  );
}

export function PageClient() {
  const { fileType, hasDiffed, viewMode, settingsOpen, leftFile, rightFile } =
    useDiffStore();

  const hasFiles = !!leftFile && !!rightFile;

  return (
    <div className="h-full flex flex-col bg-background text-foreground">
      <Toolbar />

      {fileType === "text" && (
        <>
          {!hasDiffed && <InputPanel />}

          {hasDiffed && (
            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 flex flex-col overflow-hidden">
                <Suspense fallback={<LazyFallback />}>
                  {viewMode === "split" ? <SplitView /> : <UnifiedView />}
                </Suspense>
                <StatsBar />
              </div>
              {settingsOpen && (
                <Suspense fallback={null}>
                  <div className="hidden md:block">
                    <SettingsPanel />
                  </div>
                </Suspense>
              )}
            </div>
          )}

          {!hasDiffed && settingsOpen && (
            <Suspense fallback={null}>
              <SettingsPanel />
            </Suspense>
          )}
        </>
      )}

      {fileType === "image" && (
        <>
          {!hasFiles && <InputPanel />}
          {hasFiles && (
            <Suspense fallback={<LazyFallback />}>
              <ImageDiffViewer />
            </Suspense>
          )}
        </>
      )}

    </div>
  );
}
