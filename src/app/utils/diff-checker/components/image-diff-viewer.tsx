"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDiffStore } from "../store";
import { computeImageDiff } from "../lib/image-diff";

type ImageViewMode = "side-by-side" | "overlay" | "heatmap";

export function ImageDiffViewer() {
  const { leftFile, rightFile } = useDiffStore();
  const [viewMode, setViewMode] = useState<ImageViewMode>("side-by-side");
  const [tolerance, setTolerance] = useState(10);
  const [loading, setLoading] = useState(false);
  const [leftUrl, setLeftUrl] = useState<string | null>(null);
  const [rightUrl, setRightUrl] = useState<string | null>(null);
  const [diffUrl, setDiffUrl] = useState<string | null>(null);
  const [overlayPos, setOverlayPos] = useState(50);
  const [stats, setStats] = useState<{
    percentChanged: number;
    changedPixels: number;
    totalPixels: number;
  } | null>(null);

  useEffect(() => {
    if (leftFile) {
      const url = URL.createObjectURL(leftFile);
      setLeftUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setLeftUrl(null);
  }, [leftFile]);

  useEffect(() => {
    if (rightFile) {
      const url = URL.createObjectURL(rightFile);
      setRightUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setRightUrl(null);
  }, [rightFile]);

  const compare = useCallback(async () => {
    if (!leftFile || !rightFile) return;
    setLoading(true);
    try {
      const r = await computeImageDiff(leftFile, rightFile, tolerance);
      // Convert the offscreen diff canvas to a data URL so it works
      // across view mode switches without ref issues
      const dataUrl = r.diffCanvas.toDataURL("image/png");
      setDiffUrl(dataUrl);
      setStats({
        percentChanged: r.percentChanged,
        changedPixels: r.changedPixels,
        totalPixels: r.totalPixels,
      });
    } catch (err) {
      console.error("Image diff failed:", err);
    } finally {
      setLoading(false);
    }
  }, [leftFile, rightFile, tolerance]);

  if (!leftFile || !rightFile) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Upload two images to compare
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-2 border-b border-border bg-muted/40">
        <Button onClick={compare} disabled={loading}>
          {loading ? "Comparing..." : "Compare Images"}
        </Button>

        <div className="flex items-center gap-2 text-xs">
          <label>Tolerance:</label>
          <input
            type="range"
            min={0}
            max={50}
            value={tolerance}
            onChange={(e) => setTolerance(Number(e.target.value))}
            className="w-24"
          />
          <span className="w-6 text-right">{tolerance}</span>
        </div>

        {stats && (
          <>
            <div className="flex items-center rounded-md border border-border overflow-hidden">
              {(
                [
                  ["side-by-side", "Side by Side"],
                  ["overlay", "Overlay"],
                  ["heatmap", "Heatmap"],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={v}
                  onClick={() => setViewMode(v)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium transition-colors",
                    viewMode === v
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <span className="text-xs text-muted-foreground ml-auto">
              {stats.percentChanged.toFixed(2)}% pixels changed (
              {stats.changedPixels.toLocaleString()} /{" "}
              {stats.totalPixels.toLocaleString()})
            </span>
          </>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {!diffUrl && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase">
                Current
              </div>
              {leftUrl && (
                <img
                  src={leftUrl}
                  alt="Left"
                  className="max-w-full border rounded"
                />
              )}
            </div>
            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase">
                Incoming
              </div>
              {rightUrl && (
                <img
                  src={rightUrl}
                  alt="Right"
                  className="max-w-full border rounded"
                />
              )}
            </div>
          </div>
        )}

        {diffUrl && viewMode === "side-by-side" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase">
                Current
              </div>
              {leftUrl && (
                <img
                  src={leftUrl}
                  alt="Left"
                  className="max-w-full border rounded"
                />
              )}
            </div>
            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase">
                Incoming
              </div>
              {rightUrl && (
                <img
                  src={rightUrl}
                  alt="Right"
                  className="max-w-full border rounded"
                />
              )}
            </div>
            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase">
                Diff Heatmap
              </div>
              <img
                src={diffUrl}
                alt="Diff heatmap"
                className="max-w-full border rounded"
              />
            </div>
          </div>
        )}

        {diffUrl && viewMode === "overlay" && (
          <div className="space-y-2 max-w-2xl mx-auto">
            <div className="flex items-center gap-2 text-xs">
              <span>Current</span>
              <input
                type="range"
                min={0}
                max={100}
                value={overlayPos}
                onChange={(e) => setOverlayPos(Number(e.target.value))}
                className="flex-1"
              />
              <span>Incoming</span>
            </div>
            <div className="relative border rounded overflow-hidden">
              {leftUrl && (
                <img
                  src={leftUrl}
                  alt="Left"
                  className="max-w-full"
                  style={{ opacity: 1 - overlayPos / 100 }}
                />
              )}
              {rightUrl && (
                <img
                  src={rightUrl}
                  alt="Right"
                  className="absolute inset-0 max-w-full"
                  style={{ opacity: overlayPos / 100 }}
                />
              )}
            </div>
          </div>
        )}

        {diffUrl && viewMode === "heatmap" && (
          <div className="space-y-2 max-w-2xl mx-auto">
            <div className="text-xs font-semibold text-muted-foreground uppercase">
              Diff Heatmap
            </div>
            <img
              src={diffUrl}
              alt="Diff heatmap"
              className="max-w-full border rounded"
            />
          </div>
        )}
      </div>
    </div>
  );
}
