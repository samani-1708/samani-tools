"use client";

import { FileUploaded, useFileUpload } from "@/app/common/hooks";
import { PDFStatePending } from "@/app/common/pdf-viewer/pdf-states";
import { downloadLink } from "@/app/common/utils";
import { Button } from "@/components/ui/button";
import { useVirtualizer } from "@tanstack/react-virtual";
import { DownloadIcon, FileArchiveIcon, FileTextIcon, Loader2Icon, PenLineIcon, RotateCcwIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { pdfjs } from "react-pdf";
import JSZip from "jszip";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { PDFToolLayout } from "../common/layouts/pdf-tool-layout";
import { usePDFUtils } from "../common/use-pdf-utils.hooks";

const PAGE_BATCH_SIZE = 10;

const ViewPDF = dynamic(() => import("@/app/common/pdf-viewer/pdf-viewer"), {
  ssr: false,
  loading: () => <PDFStatePending header="Loading" subHeader="" />,
});

const RichEditor = dynamic(
  () => import("./rich-editor").then((module) => module.RichEditor),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 text-sm text-muted-foreground">
        Editor loading...
      </div>
    ),
  },
);

pdfjs.GlobalWorkerOptions.workerSrc = "/js/pdf-worker/4.8.69/pdf-worker.min.js";

type ExtractedLine = {
  text: string;
  semantic: "heading" | "paragraph";
  fontSize: number;
  bold: boolean;
  italic: boolean;
};

type ExtractedPage = {
  pageNumber: number;
  text: string;
  lines: ExtractedLine[];
  spans?: Array<{
    text: string;
    fontName?: string;
    fontFamily?: string;
    fontSize: number;
    color?: string;
    width?: number;
    height?: number;
    bold: boolean;
    italic: boolean;
    underline?: boolean;
    strike?: boolean;
    x: number;
    y: number;
  }>;
  source: "native" | "ocr";
  imageNames: string[];
};

type AssetPreview = {
  name: string;
  page: number;
  blob: Blob;
  url: string;
  mime: string;
};

type ExtractResult = {
  filename: string;
  pages: number;
  images: number;
  markdown: string;
  html: string;
  markdownBlocks: string[];
  htmlBlocks: string[];
  assets: AssetPreview[];
};

type ProgressState = {
  phase: "idle" | "reading" | "finalizing" | "done";
  currentPage: number;
  totalPages: number;
  message: string;
  percent: number;
};

type ExtractWorkerProgress = {
  type: "progress";
  currentPage: number;
  totalPages: number;
  message: string;
  progress: number;
};

type OCRMode = "speed" | "balanced" | "accuracy" | "rigorous";

type ExtractWorkerDone = {
  type: "done";
  pages: ExtractedPage[];
  assets: Array<{ name: string; page: number; mime: string; buffer: ArrayBuffer }>;
};

type ExtractWorkerError = {
  type: "error";
  error: string;
};

type ExtractWorkerLog = {
  type: "log";
  message: string;
};

type ResourceNodeId =
  | "document.html"
  | "document.md"
  | "assets";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toSpanStyle(span: NonNullable<ExtractedPage["spans"]>[number]) {
  const styles: string[] = [];
  if (span.fontFamily) styles.push(`font-family:${span.fontFamily}`);
  if (Number.isFinite(span.fontSize) && span.fontSize > 0) styles.push(`font-size:${Math.max(8, Math.round(span.fontSize))}px`);
  if (span.color && /^#|rgb|hsl|[a-z]/i.test(span.color)) styles.push(`color:${span.color}`);
  if (span.bold) styles.push("font-weight:700");
  if (span.italic) styles.push("font-style:italic");
  if (span.underline) styles.push("text-decoration:underline");
  if (span.strike) styles.push("text-decoration:line-through");
  return styles.join(";");
}

function makeMarkdownBlock(page: ExtractedPage): string {
  const lineBlock = page.lines
    .map((line) => (line.semantic === "heading" ? `## ${line.text}` : line.text))
    .join("\n\n");
  const imageBlock = page.imageNames
    .map((name) => `![${name}](assets/${name})`)
    .join("\n\n");

  return [`# Page ${page.pageNumber}`, lineBlock, imageBlock]
    .filter(Boolean)
    .join("\n\n");
}

function buildEditorHtmlBlock(page: ExtractedPage, imageUrls: Map<string, string>) {
  const lines =
    page.spans && page.spans.length > 0
      ? (() => {
          const groups = new Map<number, NonNullable<ExtractedPage["spans"]>>();
          for (const span of page.spans) {
            const key = Math.round((span.y || 0) / 3) * 3;
            const row = groups.get(key) || [];
            row.push(span);
            groups.set(key, row);
          }

          return Array.from(groups.entries())
            .sort((a, b) => b[0] - a[0])
            .map(([, row]) => {
              const ordered = [...row].sort((a, b) => a.x - b.x);
              const lineText = ordered
                .map((span) => {
                  const style = toSpanStyle(span);
                  const attrs = [
                    style ? `style="${style}"` : "",
                    `data-font="${escapeHtml(span.fontName || "")}"`,
                    `data-size="${Math.round(span.fontSize || 0)}"`,
                    `data-x="${Math.round(span.x || 0)}"`,
                    `data-y="${Math.round(span.y || 0)}"`,
                    span.width ? `data-w="${Math.round(span.width)}"` : "",
                    span.height ? `data-h="${Math.round(span.height)}"` : "",
                  ]
                    .filter(Boolean)
                    .join(" ");
                  return `<span ${attrs}>${escapeHtml(span.text)}</span>`;
                })
                .join(" ");
              const headingHint = ordered.some((s) => s.bold) || ordered.some((s) => (s.fontSize || 0) >= 15);
              return headingHint ? `<h3>${lineText}</h3>` : `<p>${lineText}</p>`;
            })
            .join("\n");
        })()
      : page.lines
          .map((line) => {
            const escaped = escapeHtml(line.text);
            const lineText = `${line.bold ? "<strong>" : ""}${line.italic ? "<em>" : ""}${escaped}${line.italic ? "</em>" : ""}${line.bold ? "</strong>" : ""}`;
            if (line.semantic === "heading") return `<h3>${lineText}</h3>`;
            return `<p>${lineText}</p>`;
          })
          .join("\n");

  const images = page.imageNames
    .map((name) => {
      const src = imageUrls.get(name);
      if (!src) return "";
      return `<figure><img src=\"${src}\" alt=\"${escapeHtml(name)}\" /><figcaption>${escapeHtml(name)}</figcaption></figure>`;
    })
    .join("\n");

  const assetLinks = page.imageNames
    .map((name) => `<li><a href="assets/${escapeHtml(name)}">assets/${escapeHtml(name)}</a></li>`)
    .join("");

  return `<section data-page=\"${page.pageNumber}\"><h2>Page ${page.pageNumber}</h2>${lines}${images}${assetLinks ? `<ul>${assetLinks}</ul>` : ""}</section>`;
}

function wrapHtmlBlocks(blocks: string[]) {
  return `<article>${blocks.join("\n")}</article>`;
}

function toDownloadableText(name: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  downloadLink(url, name);
  URL.revokeObjectURL(url);
}

function inferPageFromAssetName(name: string): number {
  const match = name.match(/(\d{1,6})/);
  return match ? Number(match[1]) : 0;
}

export function PageClient() {
  const { files, fileInputRef, handleFileUpload, triggerFileInput, resetInput } =
    useFileUpload((f) => Array.from(f).filter((file) => file.type === "application/pdf"));
  const [, utils] = usePDFUtils();

  const [isExtracting, setIsExtracting] = useState(false);
  const [isBuildingZip, setIsBuildingZip] = useState(false);
  const [documentMode, setDocumentMode] = useState<"reading" | "editable">("reading");
  const [isEnablingEditor, setIsEnablingEditor] = useState(false);
  const [useOcrFallback, setUseOcrFallback] = useState(false);
  const [ocrMode, setOCRMode] = useState<OCRMode>("balanced");
  const [selectedNode, setSelectedNode] = useState<ResourceNodeId>("document.html");
  const [editorHtml, setEditorHtml] = useState("");
  const [editorVisiblePages, setEditorVisiblePages] = useState(PAGE_BATCH_SIZE);
  const [result, setResult] = useState<ExtractResult | null>(null);
  const [progress, setProgress] = useState<ProgressState>({
    phase: "idle",
    currentPage: 0,
    totalPages: 0,
    message: "Waiting for PDF upload",
    percent: 0,
  });

  const activeRunRef = useRef<string | null>(null);
  const assetsScrollRef = useRef<HTMLDivElement | null>(null);
  const assetsGridRef = useRef<HTMLDivElement | null>(null);
  const readingScrollRef = useRef<HTMLDivElement | null>(null);
  const markdownScrollRef = useRef<HTMLDivElement | null>(null);
  const fileUploaded: FileUploaded | null = files?.[0] || null;
  const [assetColumns, setAssetColumns] = useState(4);

  const fileSizeLabel = useMemo(() => {
    const bytes = fileUploaded?.file?.size || 0;
    if (!bytes) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const idx = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, idx)).toFixed(2)} ${units[idx]}`;
  }, [fileUploaded?.file?.size]);

  async function runExtraction(file: FileUploaded) {
    setIsExtracting(true);
    setProgress({
      phase: "reading",
      currentPage: 0,
      totalPages: 0,
      message: "Starting extraction workers...",
      percent: 2,
    });

    result?.assets.forEach((asset) => URL.revokeObjectURL(asset.url));
    setResult(null);
    setEditorHtml("");
    setEditorVisiblePages(PAGE_BATCH_SIZE);
    setDocumentMode("reading");

    const worker = new Worker(new URL("./extract.worker.ts", import.meta.url), {
      type: "module",
    });

    try {
      const rawBuffer = await file.file.arrayBuffer();

      const workerPromise = new Promise<{ pages: ExtractedPage[]; assets: Array<{ name: string; page: number; mime: string; buffer: ArrayBuffer }> }>((resolve, reject) => {
        worker.onmessage = (event: MessageEvent<ExtractWorkerProgress | ExtractWorkerDone | ExtractWorkerError | ExtractWorkerLog | unknown>) => {
          const data = event.data as any;
          if (!data || typeof data !== "object" || typeof data.type !== "string") {
            console.warn("[extract.worker.unknown]", data);
            return;
          }

          if (data.type === "log") {
            console.info("[extract.worker]", data.message);
            return;
          }
          if (data.type === "progress") {
            setProgress({
              phase: data.progress >= 96 ? "finalizing" : "reading",
              currentPage: data.currentPage,
              totalPages: data.totalPages,
              message: data.message,
              percent: data.progress,
            });
            return;
          }

          if (data.type === "done") {
            resolve({ pages: data.pages, assets: data.assets });
            return;
          }

          if (data.type === "error") {
            const errorText =
              typeof data.error === "string" && data.error.trim().length > 0
                ? data.error
                : `Unknown extract worker error payload: ${JSON.stringify(data)}`;
            console.error("[extract.worker.error]", errorText);
            reject(new Error(errorText));
            return;
          }

          console.warn("[extract.worker.unhandled-type]", data.type, data);
        };

        worker.onerror = (event) => {
          console.error("[extract.worker.onerror]", event);
          reject(new Error(event.message || "Extraction worker failed"));
        };
      });

      const trustedAssetsPromise = utils
        .extractImages({
          id: file.id,
          buffer: rawBuffer.slice(0),
        }, { skipLikelyMaskAssets: true })
        .then((extracted) =>
          extracted.map((asset) => {
            const lower = asset.path.toLowerCase();
            const mime = lower.endsWith(".jpg") || lower.endsWith(".jpeg")
              ? "image/jpeg"
              : lower.endsWith(".webp")
                ? "image/webp"
                : "image/png";
            const name = asset.path.split("/").pop() || "asset.png";
            return {
              name,
              page: inferPageFromAssetName(name),
              mime,
              buffer: asset.buffer,
            };
          }),
        )
        .catch((error) => {
          console.warn("[extract-content] trusted asset extraction failed", error);
          return [];
        });

      const transferable = rawBuffer.slice(0);
      worker.postMessage(
        {
          type: "extract",
          fileBuffer: transferable,
          useOcrFallback,
          ocrMode,
        },
        [transferable],
      );

      const [{ pages, assets: workerAssets }, trustedAssets] = await Promise.all([
        workerPromise,
        trustedAssetsPromise,
      ]);
      console.info(
        "[extract-content] asset counts",
        { trusted: trustedAssets.length, worker: workerAssets.length },
      );

      const finalAssetsRaw = trustedAssets.length > 0 ? trustedAssets : workerAssets;
      const seen = new Set<string>();
      const finalAssets = finalAssetsRaw.filter((asset) => {
        const key = `${asset.name}:${asset.buffer.byteLength}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const assetPreviews: AssetPreview[] = finalAssets.map((asset) => {
        const blob = new Blob([asset.buffer], { type: asset.mime });
        return {
          name: asset.name,
          page: asset.page,
          mime: asset.mime,
          blob,
          url: URL.createObjectURL(blob),
        };
      });

      const imageUrlMap = new Map(assetPreviews.map((asset) => [asset.name, asset.url]));

      setProgress({
        phase: "finalizing",
        currentPage: pages.length,
        totalPages: pages.length,
        message: `Preparing workspace (${assetPreviews.length} assets)`,
        percent: 95,
      });

      const markdownBlocks = pages.map((page) => makeMarkdownBlock(page));
      const htmlBlocks = pages.map((page) => buildEditorHtmlBlock(page, imageUrlMap));
      const markdown = markdownBlocks.join("\n\n");
      const html = wrapHtmlBlocks(htmlBlocks);
      const baseName = file.name.replace(/\.pdf$/i, "");

      setResult({
        filename: `${baseName}-extracted.zip`,
        pages: pages.length,
        images: assetPreviews.length,
        markdown,
        html,
        markdownBlocks,
        htmlBlocks,
        assets: assetPreviews,
      });

      setEditorHtml("");
      setDocumentMode("reading");
      setProgress({
        phase: "done",
        currentPage: pages.length,
        totalPages: pages.length,
        message: "Extraction complete",
        percent: 100,
      });
      if (assetPreviews.length === 0) {
        toast.warning("No embedded assets found in this PDF");
      }
      toast.success("Extracted text and assets");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[extract-content] extraction failed", error);
      setProgress({
        phase: "idle",
        currentPage: 0,
        totalPages: 0,
        message: "Extraction failed",
        percent: 0,
      });
      toast.error(`Unable to extract PDF content: ${message}`);
    } finally {
      worker.terminate();
      setIsExtracting(false);
    }
  }

  useEffect(() => {
    if (!fileUploaded) return;
    if (activeRunRef.current === `${fileUploaded.id}:${useOcrFallback}:${ocrMode}`) return;
    activeRunRef.current = `${fileUploaded.id}:${useOcrFallback}:${ocrMode}`;
    runExtraction(fileUploaded).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileUploaded?.id, useOcrFallback, ocrMode]);

  useEffect(() => {
    return () => {
      result?.assets.forEach((asset) => URL.revokeObjectURL(asset.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  function handleStartOver() {
    result?.assets.forEach((asset) => URL.revokeObjectURL(asset.url));
    setResult(null);
    setEditorHtml("");
    setEditorVisiblePages(PAGE_BATCH_SIZE);
    setDocumentMode("reading");
    setUseOcrFallback(false);
    setOCRMode("balanced");
    setSelectedNode("document.html");
    setProgress({
      phase: "idle",
      currentPage: 0,
      totalPages: 0,
      message: "Waiting for PDF upload",
      percent: 0,
    });
    activeRunRef.current = null;
    resetInput();
  }

  function downloadCurrentResource() {
    if (!result) return;

    if (selectedNode === "document.html") {
      const htmlForDownload =
        documentMode === "editable" && editorVisiblePages >= result.pages && editorHtml
          ? editorHtml
          : result.html;
      toDownloadableText("document.html", htmlForDownload, "text/html;charset=utf-8");
      return;
    }
    if (selectedNode === "document.md") {
      toDownloadableText("document.md", result.markdown, "text/markdown;charset=utf-8");
    }
  }

  async function handleZipDownload() {
    if (!result) return;
    setIsBuildingZip(true);
    try {
      const zip = new JSZip();
      zip.file("document.md", result.markdown, { compression: "DEFLATE", compressionOptions: { level: 6 } });
      const htmlForZip =
        documentMode === "editable" && editorVisiblePages >= result.pages && editorHtml
          ? editorHtml
          : result.html;
      zip.file("document.html", htmlForZip, { compression: "DEFLATE", compressionOptions: { level: 6 } });

      for (const asset of result.assets) {
        // Most image assets are already compressed; skip recompression for speed.
        zip.file(`assets/${asset.name}`, asset.blob, { compression: "STORE" });
      }

      const zipBlob = await zip.generateAsync({ type: "blob", compression: "STORE" });
      const zipUrl = URL.createObjectURL(zipBlob);
      downloadLink(zipUrl, result.filename);
      URL.revokeObjectURL(zipUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[extract-content] ZIP export failed", error);
      toast.error(`ZIP export failed: ${message}`);
    } finally {
      setIsBuildingZip(false);
    }
  }

  function handleEnableEditor() {
    if (!result || documentMode === "editable" || isEnablingEditor) return;
    setIsEnablingEditor(true);
    requestAnimationFrame(() => {
      const initialCount = Math.min(PAGE_BATCH_SIZE, result.htmlBlocks.length);
      setEditorVisiblePages(initialCount);
      setEditorHtml(wrapHtmlBlocks(result.htmlBlocks.slice(0, initialCount)));
      setDocumentMode("editable");
      setIsEnablingEditor(false);
    });
  }

  useEffect(() => {
    setEditorVisiblePages(PAGE_BATCH_SIZE);
  }, [result?.images]);

  useEffect(() => {
    if (!result || documentMode !== "editable") return;
    setEditorHtml(wrapHtmlBlocks(result.htmlBlocks.slice(0, editorVisiblePages)));
  }, [editorVisiblePages, documentMode, result]);

  useEffect(() => {
    const grid = assetsGridRef.current;
    if (!grid) return;
    const calcColumns = () => {
      const w = grid.clientWidth;
      if (w < 768) return 2;
      if (w < 1280) return 3;
      return 4;
    };
    setAssetColumns(calcColumns());
    const ro = new ResizeObserver(() => setAssetColumns(calcColumns()));
    ro.observe(grid);
    return () => ro.disconnect();
  }, [selectedNode, result?.images]);

  const assetRowCount = useMemo(() => {
    const count = result?.assets.length || 0;
    return Math.ceil(count / Math.max(1, assetColumns));
  }, [result?.assets.length, assetColumns]);

  const assetsVirtualizer = useVirtualizer({
    count: assetRowCount,
    getScrollElement: () => assetsScrollRef.current,
    estimateSize: () => 230,
    overscan: 4,
  });

  const readingVirtualizer = useVirtualizer({
    count: result?.htmlBlocks.length || 0,
    getScrollElement: () => readingScrollRef.current,
    estimateSize: () => 520,
    overscan: 3,
  });

  const markdownVirtualizer = useVirtualizer({
    count: result?.markdownBlocks.length || 0,
    getScrollElement: () => markdownScrollRef.current,
    estimateSize: () => 260,
    overscan: 3,
  });

  return (
    <PDFToolLayout
      showUpload={files.length === 0}
      uploadProps={{
        title: "Upload PDF File",
        subtitle: "Extraction starts immediately after upload",
        label: "Upload PDF",
        fileInputRef,
        handleFileUpload,
        triggerFileInput,
      }}
      sidebarTitle="Extract Content"
      sidebarWidth="sm"
      content={
        fileUploaded ? (
          <div className="w-full max-w-[1400px] mx-auto grid gap-4 xl:grid-cols-[16rem_1fr] h-[calc(100vh-8.5rem)] min-h-[560px]">
            <aside className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden h-full flex flex-col">
              <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 text-xs text-muted-foreground">Files</div>
              <div className="p-2 space-y-1 text-sm">
                <button
                  type="button"
                  onClick={() => setSelectedNode("document.html")}
                  className={`w-full text-left px-2 py-1.5 rounded flex items-center gap-2 ${selectedNode === "document.html" ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-200"}`}
                >
                  <FileTextIcon className="w-4 h-4" /> document.html
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedNode("document.md")}
                  className={`w-full text-left px-2 py-1.5 rounded flex items-center gap-2 ${selectedNode === "document.md" ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-200"}`}
                >
                  <FileTextIcon className="w-4 h-4" /> document.md
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedNode("assets")}
                  className={`w-full text-left px-2 py-1.5 rounded flex items-center gap-2 ${selectedNode === "assets" ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-200"}`}
                >
                  <FileArchiveIcon className="w-4 h-4" /> assets/ ({result?.images || 0})
                </button>
              </div>

              <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                <Button variant="outline" size="sm" className="w-full" onClick={downloadCurrentResource} disabled={!result || selectedNode === "assets" || isExtracting}>
                  Download selected
                </Button>
              </div>
            </aside>

            <section className="h-full overflow-hidden">

              {selectedNode === "document.html" && (
                isExtracting && !result ? (
                  <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-8 text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2Icon className="w-4 h-4 animate-spin" /> Building formatted editor content...
                  </div>
                ) : (
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden h-full flex flex-col">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3">
                      <div className="inline-flex items-center rounded-md border border-gray-200 dark:border-gray-700 p-1">
                        <Button
                          size="sm"
                          variant={documentMode === "reading" ? "default" : "ghost"}
                          onClick={() => setDocumentMode("reading")}
                        >
                          Reading
                        </Button>
                        <Button
                          size="sm"
                          variant={documentMode === "editable" ? "default" : "ghost"}
                          onClick={handleEnableEditor}
                          disabled={!result || isEnablingEditor}
                        >
                          {isEnablingEditor ? <Loader2Icon className="w-4 h-4 mr-1 animate-spin" /> : <PenLineIcon className="w-4 h-4 mr-1" />}
                          Editable
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {documentMode === "reading"
                          ? `${readingVirtualizer.getVirtualItems().length}/${result?.pages || 0} pages`
                          : `${Math.min(editorVisiblePages, result?.pages || 0)}/${result?.pages || 0} pages`}
                      </p>
                    </div>
                    {documentMode === "reading" ? (
                      <div ref={readingScrollRef} className="flex-1 overflow-auto p-4 prose prose-sm max-w-none dark:prose-invert">
                        <div style={{ height: `${readingVirtualizer.getTotalSize()}px`, width: "100%", position: "relative" }}>
                          {readingVirtualizer.getVirtualItems().map((virtualItem) => (
                            <div
                              key={virtualItem.key}
                              ref={readingVirtualizer.measureElement}
                              data-index={virtualItem.index}
                              style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                transform: `translateY(${virtualItem.start}px)`,
                              }}
                              dangerouslySetInnerHTML={{ __html: result?.htmlBlocks[virtualItem.index] || "" }}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 overflow-auto p-4 prose prose-sm max-w-none dark:prose-invert">
                        <RichEditor initialContent={editorHtml || result?.html || ""} onChange={setEditorHtml} editable={Boolean(result)} />
                        {result && editorVisiblePages < result.pages ? (
                          <div className="flex justify-center mt-3">
                            <Button variant="outline" onClick={() => setEditorVisiblePages((count) => Math.min(count + PAGE_BATCH_SIZE, result.pages))}>
                              Load next {Math.min(PAGE_BATCH_SIZE, result.pages - editorVisiblePages)} pages in editor
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                )
              )}

              {selectedNode === "document.md" && (
                <div ref={markdownScrollRef} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 h-full overflow-auto">
                  <p className="text-xs text-muted-foreground mb-3">
                    Markdown pages: {markdownVirtualizer.getVirtualItems().length}/{result?.pages || 0}
                  </p>
                  <div style={{ height: `${markdownVirtualizer.getTotalSize()}px`, width: "100%", position: "relative" }}>
                    {markdownVirtualizer.getVirtualItems().map((virtualItem) => (
                      <div
                        key={virtualItem.key}
                        ref={markdownVirtualizer.measureElement}
                        data-index={virtualItem.index}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          transform: `translateY(${virtualItem.start}px)`,
                        }}
                      >
                        <pre className="text-xs font-mono whitespace-pre-wrap break-words rounded border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800/50 mb-3">
                          {result?.markdownBlocks[virtualItem.index] || ""}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedNode === "assets" && (
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 h-full overflow-hidden flex flex-col">
                  {!result ? (
                    <p className="text-sm text-muted-foreground">Assets will appear as extraction progresses.</p>
                  ) : result.assets.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No embedded assets found.</p>
                  ) : (
                    <div className="space-y-4 h-full flex flex-col">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          Showing {result.assets.length} assets
                        </p>
                        <Button size="sm" variant="outline" onClick={() => setSelectedNode("document.html")}>
                          Back to document
                        </Button>
                      </div>

                      <div ref={assetsScrollRef} className="flex-1 overflow-auto" >
                        <div ref={assetsGridRef} className="w-full">
                          <div style={{ height: `${assetsVirtualizer.getTotalSize()}px`, width: "100%", position: "relative" }}>
                            {assetsVirtualizer.getVirtualItems().map((virtualRow) => {
                              const start = virtualRow.index * assetColumns;
                              const rowAssets = result.assets.slice(start, start + assetColumns);
                              return (
                                <div
                                  key={virtualRow.key}
                                  className="gap-3 pb-3"
                                  ref={assetsVirtualizer.measureElement}
                                  data-index={virtualRow.index}
                                  style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    display: "grid",
                                    gridTemplateColumns: `repeat(${assetColumns}, minmax(0, 1fr))`,
                                    transform: `translateY(${virtualRow.start}px)`,
                                  }}
                                >
                                  {rowAssets.map((asset) => (
                                    <div key={asset.name} className="rounded border border-gray-200 dark:border-gray-700 p-2">
                                      <img src={asset.url} alt={asset.name} className="w-full aspect-square rounded object-contain bg-gray-50 dark:bg-gray-800" />
                                      <p className="mt-2 text-[11px] truncate" title={asset.name}>{asset.name}</p>
                                      <p className="text-[10px] text-muted-foreground">page {asset.page || "-"}</p>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="mt-2 w-full h-7 text-[11px]"
                                        onClick={() => downloadLink(asset.url, asset.name)}
                                      >
                                        Download
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </section>
          </div>
        ) : null
      }
      controls={
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3">
            <p className="text-xs text-muted-foreground mb-2">PDF preview</p>
            <div className="h-56 rounded bg-gray-100 dark:bg-gray-800 overflow-hidden flex items-start justify-center p-2">
              {fileUploaded ? (
                <div className="w-fit">
                  <ViewPDF
                    src={fileUploaded.file}
                    range={[0]}
                    width={170}
                    forceRefresh
                    defaultOverrides={{ pageBetweenMargin: "0px", pageBoxShadow: "none" }}
                  />
                </div>
              ) : (
                <Loader2Icon className="w-5 h-5 animate-spin text-muted-foreground" />
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground truncate" title={fileUploaded?.name}>{fileUploaded?.name}</p>
            <p className="text-xs text-muted-foreground">{fileSizeLabel}</p>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progress.percent}%</span>
            </div>
            <div className="h-2 w-full rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div className="h-full bg-blue-500 transition-all" style={{ width: `${progress.percent}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">{progress.message}</p>
            {progress.totalPages > 0 ? (
              <p className="text-xs text-muted-foreground mt-1">{progress.currentPage}/{progress.totalPages} pages</p>
            ) : null}
          </div>

          <label className="flex items-center gap-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3">
            <input
              type="checkbox"
              checked={useOcrFallback}
              disabled={isExtracting}
              onChange={(e) => {
                setUseOcrFallback(e.target.checked);
                activeRunRef.current = null;
              }}
              className="h-4 w-4"
            />
            OCR fallback for scanned pages
          </label>

          {useOcrFallback ? (
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 space-y-2">
              <p className="text-xs text-muted-foreground">OCR mode</p>
              <select
                className="w-full rounded border border-gray-300 dark:border-gray-700 bg-background px-2 py-1.5 text-sm"
                value={ocrMode}
                disabled={isExtracting}
                onChange={(e) => {
                  setOCRMode(e.target.value as OCRMode);
                  activeRunRef.current = null;
                }}
              >
                <option value="speed">Speed</option>
                <option value="balanced">Balanced</option>
                <option value="accuracy">Accuracy</option>
                <option value="rigorous">Rigorous (multi-pass)</option>
              </select>
            </div>
          ) : null}
        </div>
      }
      actions={
        result ? (
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={handleZipDownload} className="h-10 sm:h-11 font-semibold" disabled={isBuildingZip || isExtracting}>
              {isBuildingZip ? <Loader2Icon className="w-4 h-4 mr-2 animate-spin" /> : null}
              Download
              <DownloadIcon className="w-4 h-4 ml-1.5" />
            </Button>
            <Button
              variant="outline"
              onClick={() => fileUploaded && runExtraction(fileUploaded)}
              disabled={!fileUploaded || isExtracting}
              className="h-10 sm:h-11"
            >
              Run again
            </Button>
          </div>
        ) : (
          <Button disabled className="w-full h-10 sm:h-11">
            <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </Button>
        )
      }
      secondaryActions={
        <Button
          variant="outline"
          onClick={handleStartOver}
          disabled={isExtracting}
          className="h-10 w-10 p-0"
          aria-label="Start over"
        >
          <RotateCcwIcon className="w-4 h-4" />
        </Button>
      }
    />
  );
}
