"use client";

import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpenIcon, DownloadIcon, EraserIcon, EyeIcon, SquarePenIcon } from "lucide-react";
import { toast } from "sonner";
import { UtilityToolLayout } from "@/app/utils/common/utility-tool-layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SAMPLE_MARKDOWN = `# Markdown Viewer

Clean preview with **typography**, tables, checklists, and code.

## Features
- [x] GitHub Flavored Markdown
- [x] Tables and task lists
- [x] Fenced code blocks
- [x] Download as PDF

## Table
| Tool | Type | Status |
|---|---|---|
| Markdown Viewer | Utility | Ready |
| JSON Viewer | Utility | Ready |

## Code
\`\`\`ts
type Status = "ready" | "draft";

export function toBadge(status: Status) {
  return status === "ready" ? "✅ Ready" : "🧪 Draft";
}
\`\`\`

> Tip: Use **Download as PDF** with theme and quality controls.
`;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

type ExportQuality = "normal" | "high" | "ultra";
type RenderTheme = "paper" | "classic" | "midnight";

const QUALITY_SCALE: Record<ExportQuality, number> = {
  normal: 1.5,
  high: 2,
  ultra: 3,
};

const JPEG_QUALITY: Record<ExportQuality, number> = {
  normal: 0.82,
  high: 0.92,
  ultra: 0.98,
};

const THEME_BG: Record<RenderTheme, string> = {
  paper: "#ffffff",
  classic: "#fafaf7",
  midnight: "#0b1220",
};

const ReactMarkdownLazy = lazy(() => import("react-markdown"));

export function PageClient() {
  const [markdown, setMarkdown] = useState(SAMPLE_MARKDOWN);
  const [mode, setMode] = useState<"preview" | "source">("source");
  const [quality, setQuality] = useState<ExportQuality>("high");
  const [theme, setTheme] = useState<RenderTheme>("paper");
  const [isExporting, setIsExporting] = useState(false);
  const [pluginsReady, setPluginsReady] = useState(false);
  const [markdownReady, setMarkdownReady] = useState(false);
  const [remarkPlugins, setRemarkPlugins] = useState<unknown[]>([]);
  const [rehypePlugins, setRehypePlugins] = useState<unknown[]>([]);
  const exportRef = useRef<HTMLDivElement | null>(null);
  const pluginsLoadPromiseRef = useRef<Promise<void> | null>(null);
  const markdownLoadPromiseRef = useRef<Promise<void> | null>(null);

  const loadMarkdownPlugins = useCallback(async () => {
    if (pluginsReady) return;
    if (!pluginsLoadPromiseRef.current) {
      pluginsLoadPromiseRef.current = Promise.all([
        import("remark-gfm"),
        import("remark-breaks"),
        import("rehype-slug"),
        import("rehype-highlight"),
      ])
        .then(([remarkGfm, remarkBreaks, rehypeSlug, rehypeHighlight]) => {
          setRemarkPlugins([remarkGfm.default, remarkBreaks.default]);
          setRehypePlugins([
            rehypeSlug.default,
            rehypeHighlight.default,
          ]);
          setPluginsReady(true);
        })
        .catch((error) => {
          pluginsLoadPromiseRef.current = null;
          throw error;
        });
    }
    await pluginsLoadPromiseRef.current;
  }, [pluginsReady]);

  const loadMarkdownRenderer = useCallback(async () => {
    if (markdownReady) return;
    if (!markdownLoadPromiseRef.current) {
      markdownLoadPromiseRef.current = import("react-markdown")
        .then(() => setMarkdownReady(true))
        .catch((error) => {
          markdownLoadPromiseRef.current = null;
          throw error;
        });
    }
    await markdownLoadPromiseRef.current;
  }, [markdownReady]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const preload = () => {
      if (cancelled) return;
      void loadMarkdownPlugins();
      void loadMarkdownRenderer();
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const idleId = (
        window as Window & {
          requestIdleCallback: (
            callback: IdleRequestCallback,
            options?: IdleRequestOptions
          ) => number;
          cancelIdleCallback: (id: number) => void;
        }
      ).requestIdleCallback(() => preload(), { timeout: 1200 });

      return () => {
        cancelled = true;
        (
          window as Window & {
            cancelIdleCallback: (id: number) => void;
          }
        ).cancelIdleCallback(idleId);
      };
    }

    timeoutId = setTimeout(preload, 180);
    return () => {
      cancelled = true;
      if (timeoutId !== null) clearTimeout(timeoutId);
    };
  }, [loadMarkdownPlugins, loadMarkdownRenderer]);

  const stats = useMemo(() => {
    const lines = markdown.split("\n").length;
    const words = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
    const bytes = new Blob([markdown]).size;
    return { lines, words, bytes };
  }, [markdown]);

  const handleDownloadPdf = async () => {
    const target = exportRef.current;
    if (!target) {
      toast.error("Unable to export PDF right now.");
      return;
    }

    let iframe: HTMLIFrameElement | null = null;
    try {
      setIsExporting(true);
      await loadMarkdownPlugins();
      await loadMarkdownRenderer();
      iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.left = "-100000px";
      iframe.style.top = "0";
      iframe.style.width = "1123px";
      iframe.style.height = "794px";
      iframe.style.opacity = "0";
      iframe.style.pointerEvents = "none";
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument;
      if (!iframeDoc) {
        throw new Error("Failed to create export frame");
      }

      const baseText = theme === "midnight" ? "#cbd5e1" : "#1f2937";
      const headingText = theme === "midnight" ? "#f8fafc" : "#111827";
      const linkText = theme === "midnight" ? "#67e8f9" : "#0369a1";
      const preBg = theme === "midnight" ? "#000000" : "#0f172a";
      const preText = "#e2e8f0";

      iframeDoc.open();
      iframeDoc.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        padding: 0;
        background: ${THEME_BG[theme]};
        color: ${baseText};
        font-family: Arial, Helvetica, sans-serif;
        line-height: 1.65;
        font-variant-ligatures: none;
        font-feature-settings: "liga" 0, "clig" 0;
      }
      #export-root {
        width: 1123px;
        padding: 48px;
        background: ${THEME_BG[theme]};
      }
      #export-root h1, #export-root h2, #export-root h3, #export-root h4, #export-root h5, #export-root h6 {
        font-family: Arial, Helvetica, sans-serif;
        color: ${headingText};
        line-height: 1.25;
        margin-top: 1.25em;
        margin-bottom: 0.5em;
        letter-spacing: 0;
        word-spacing: normal;
        font-kerning: normal;
      }
      #export-root p, #export-root li { margin: 0.5em 0; }
      #export-root a { color: ${linkText}; text-decoration: underline; }
      #export-root code {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        font-size: 0.92em;
      }
      #export-root pre {
        background: ${preBg};
        color: ${preText};
        padding: 14px;
        border-radius: 8px;
        overflow: hidden;
      }
      #export-root pre code {
        background: transparent;
        color: inherit;
      }
      #export-root table {
        width: 100%;
        border-collapse: collapse;
        margin: 1em 0;
      }
      #export-root th, #export-root td {
        border: 1px solid ${theme === "midnight" ? "#334155" : "#d1d5db"};
        padding: 8px 10px;
        text-align: left;
      }
      #export-root blockquote {
        margin: 1em 0;
        padding-left: 12px;
        border-left: 3px solid ${theme === "midnight" ? "#334155" : "#d1d5db"};
      }
    </style>
  </head>
  <body>
    <div id="export-root">${target.innerHTML}</div>
  </body>
</html>`);
      iframeDoc.close();

      await new Promise<void>((resolve) => {
        const ready = () => resolve();
        if (iframe?.contentWindow?.document.readyState === "complete") {
          ready();
        } else {
          iframe?.addEventListener("load", ready, { once: true });
          setTimeout(ready, 120);
        }
      });

      const frameRoot = iframeDoc.getElementById("export-root");
      if (!frameRoot) {
        throw new Error("Export content is unavailable");
      }

      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(frameRoot, {
        scale: QUALITY_SCALE[quality],
        useCORS: true,
        foreignObjectRendering: true,
        backgroundColor: THEME_BG[theme],
        windowWidth: 1123,
      });
      const pageHeightPx = Math.floor((canvas.width * 841.89) / 595.28);
      if (pageHeightPx <= 0) {
        throw new Error("Invalid PDF page height");
      }
      const pageBuffers: ArrayBuffer[] = [];

      for (let offsetY = 0; offsetY < canvas.height; offsetY += pageHeightPx) {
        const sliceHeight = Math.min(pageHeightPx, canvas.height - offsetY);
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeight;
        const ctx = pageCanvas.getContext("2d");
        if (!ctx) {
          throw new Error("Failed to prepare PDF page canvas");
        }

        ctx.drawImage(
          canvas,
          0,
          offsetY,
          canvas.width,
          sliceHeight,
          0,
          0,
          canvas.width,
          sliceHeight
        );

        const blob = await new Promise<Blob>((resolve, reject) => {
          pageCanvas.toBlob(
            (result) => {
              if (!result) {
                reject(new Error("Failed to capture page image"));
                return;
              }
              resolve(result);
            },
            "image/png",
            JPEG_QUALITY[quality]
          );
        });
        const buffer = await blob.arrayBuffer();
        pageBuffers.push(buffer);
      }

      const worker = new Worker(new URL("./pdf-export.worker.ts", import.meta.url));
      const pdfBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        worker.onmessage = (
          event: MessageEvent<
            | { type: "EXPORT_SUCCESS"; pdfBuffer: ArrayBuffer }
            | { type: "EXPORT_ERROR"; message: string }
          >
        ) => {
          const message = event.data;
          if (message.type === "EXPORT_SUCCESS") {
            resolve(message.pdfBuffer);
            return;
          }
          reject(new Error(message.message));
        };
        worker.onerror = (event) => {
          reject(new Error(event.message || "Export worker failed"));
        };
        worker.postMessage(
          {
            type: "EXPORT_PDF",
            pages: pageBuffers,
            backgroundHex: THEME_BG[theme],
          },
          [...pageBuffers]
        );
      }).finally(() => {
        worker.terminate();
      });

      const pdfBlob = new Blob([pdfBuffer], { type: "application/pdf" });
      const downloadUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "markdown-document.pdf";
      link.click();
      URL.revokeObjectURL(downloadUrl);
      toast.success("PDF downloaded");
    } catch (error) {
      console.error("[markdown-viewer] PDF export failed", error);
      const message = error instanceof Error ? error.message : "Unknown export error";
      toast.error(`Failed to export PDF: ${message}`);
    } finally {
      if (iframe && iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
      setIsExporting(false);
    }
  };

  const handleClear = () => {
    setMarkdown("");
  };

  const markdownClasses =
    theme === "paper"
      ? "prose prose-slate max-w-none prose-pre:bg-zinc-950 prose-pre:text-zinc-100 prose-code:before:content-none prose-code:after:content-none"
      : theme === "classic"
        ? "prose prose-neutral max-w-none prose-headings:font-serif prose-pre:bg-[#0f172a] prose-pre:text-[#e2e8f0] prose-code:before:content-none prose-code:after:content-none"
        : "prose prose-invert max-w-none prose-headings:text-slate-100 prose-p:text-slate-300 prose-strong:text-slate-100 prose-a:text-cyan-300 prose-pre:bg-black prose-pre:text-zinc-100 prose-code:before:content-none prose-code:after:content-none";

  const previewPanelClass =
    theme === "paper"
      ? "bg-card"
      : theme === "classic"
        ? "bg-[#fafaf7]"
        : "bg-[#0b1220] border-slate-700";

  const renderMarkdown = (
    <article className={markdownClasses}>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading markdown renderer...</p>}>
        <ReactMarkdownLazy
          remarkPlugins={remarkPlugins as never}
          rehypePlugins={rehypePlugins as never}
          components={{
            a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" />,
            table: (props) => <table {...props} className="block w-full overflow-x-auto" />,
          }}
        >
          {markdown}
        </ReactMarkdownLazy>
      </Suspense>
    </article>
  );

  const content = (
    <div className="markdown-print-shell h-full">
      <Tabs value={mode} onValueChange={(value) => setMode(value as typeof mode)} className="h-full">
        <TabsList>
          <TabsTrigger value="source">
            <SquarePenIcon className="h-4 w-4" />
            Source
          </TabsTrigger>
          <TabsTrigger value="preview">
            <EyeIcon className="h-4 w-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="mt-4 h-[calc(100%-3rem)]">
          <div className={`markdown-print-root h-full overflow-auto rounded-lg border p-6 ${previewPanelClass}`}>
            {renderMarkdown}
          </div>
        </TabsContent>

        <TabsContent value="source" className="mt-4 h-[calc(100%-3rem)]">
          <Textarea
            className="h-full min-h-[420px] resize-none font-mono text-sm"
            value={markdown}
            onChange={(event) => setMarkdown(event.target.value)}
            placeholder="Write Markdown here..."
          />
        </TabsContent>
      </Tabs>
    </div>
  );

  const controls = (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="markdown-theme">PDF Theme</Label>
        <select
          id="markdown-theme"
          value={theme}
          onChange={(event) => setTheme(event.target.value as RenderTheme)}
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="paper">Paper</option>
          <option value="classic">Classic</option>
          <option value="midnight">Midnight</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="markdown-quality">PDF Quality</Label>
        <select
          id="markdown-quality"
          value={quality}
          onChange={(event) => setQuality(event.target.value as ExportQuality)}
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="normal">Normal (faster)</option>
          <option value="high">High</option>
          <option value="ultra">Ultra (larger file)</option>
        </select>
      </div>

      <div className="rounded-lg border bg-muted/30 p-3 text-sm">
        <div className="flex items-center justify-between py-1">
          <span className="text-muted-foreground">Lines</span>
          <span className="font-medium">{stats.lines.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between py-1">
          <span className="text-muted-foreground">Words</span>
          <span className="font-medium">{stats.words.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between py-1">
          <span className="text-muted-foreground">Size</span>
          <span className="font-medium">{formatSize(stats.bytes)}</span>
        </div>
      </div>
    </div>
  );

  const actions = (
    <div className="flex w-full items-center justify-between gap-2">
      <Button onClick={handleClear} variant="ghost">
        <EraserIcon className="h-4 w-4" />
        Clear
      </Button>
      <Button onClick={handleDownloadPdf} disabled={isExporting}>
        <DownloadIcon className="h-4 w-4" />
        {isExporting ? "Preparing PDF..." : "Download PDF"}
      </Button>
    </div>
  );

  return (
    <>
      <UtilityToolLayout
        sidebarTitle="Markdown Viewer"
        sidebarIcon={<BookOpenIcon className="h-5 w-5" />}
        content={content}
        controls={controls}
        actions={actions}
      />
      <div className="pointer-events-none fixed -left-[99999px] top-0 z-[-1]">
        <div
          ref={exportRef}
          className="markdown-export-root w-[1123px] p-12"
          style={{ backgroundColor: THEME_BG[theme] }}
        >
          <article
            className={
              theme === "paper"
                ? "prose prose-slate max-w-none prose-pre:bg-zinc-950 prose-pre:text-zinc-100 prose-code:before:content-none prose-code:after:content-none"
                : theme === "classic"
                  ? "prose prose-neutral max-w-none prose-headings:font-serif prose-pre:bg-[#0f172a] prose-pre:text-[#e2e8f0] prose-code:before:content-none prose-code:after:content-none"
                  : "prose prose-invert max-w-none prose-headings:text-slate-100 prose-p:text-slate-300 prose-strong:text-slate-100 prose-a:text-cyan-300 prose-pre:bg-black prose-pre:text-zinc-100 prose-code:before:content-none prose-code:after:content-none"
            }
          >
            <Suspense fallback={<p>Loading...</p>}>
              <ReactMarkdownLazy
                remarkPlugins={remarkPlugins as never}
                rehypePlugins={rehypePlugins as never}
              >
                {markdown}
              </ReactMarkdownLazy>
            </Suspense>
          </article>
        </div>
      </div>
      <style jsx global>{`
        .hljs-keyword,
        .hljs-selector-tag,
        .hljs-literal,
        .hljs-section,
        .hljs-link {
          color: #c4b5fd;
        }
        .hljs-string,
        .hljs-title,
        .hljs-name,
        .hljs-type,
        .hljs-attribute,
        .hljs-symbol {
          color: #86efac;
        }
        .hljs-number,
        .hljs-meta {
          color: #fca5a5;
        }
        .hljs-comment,
        .hljs-quote {
          color: #a1a1aa;
        }
      `}</style>
    </>
  );
}
