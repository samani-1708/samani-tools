"use client";

import { FileUploaded, useFileUpload } from "@/app/common/hooks";
import { UploadButtonFull } from "@/app/common/upload";
import { Button } from "@/components/ui/button";
import {
  ArrowRightIcon,
  DownloadIcon,
  GripVerticalIcon,
  Loader2Icon,
  PlusIcon,
  RotateCcwIcon,
  RotateCwIcon,
  Trash2Icon,
  LayoutGridIcon,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState, useCallback, useRef, useMemo, startTransition } from "react";
import { toast } from "sonner";
import { useVirtualizer } from "@tanstack/react-virtual";
import { usePDFUtils } from "../common/use-pdf-utils.hooks";
import { downloadLink } from "@/app/common/utils";

const PDFDocumentProvider = dynamic(
  () => import("@/app/common/pdf-viewer/pdf-viewer").then((mod) => ({ default: mod.PDFDocumentProvider })),
  { ssr: false },
);

const PDFPageThumbnail = dynamic(
  () => import("@/app/common/pdf-viewer/pdf-viewer").then((mod) => ({ default: mod.PDFPageThumbnail })),
  { ssr: false },
);

interface PageState {
  originalIndex: number;
  rotation: number;
  isDeleted: boolean;
}

const GAP = 16;
const MIN_CARD_WIDTH = 150;
const CARD_ASPECT = 4 / 3; // height / width (portrait)

export function PageClient() {
  // ── 1. Props & hooks ──────────────────────────────────────────────────
  const {
    files,
    fileInputRef,
    handleFileUpload,
    triggerFileInput,
    resetInput,
  } = useFileUpload((f) =>
    Array.from(f).filter((file) => file.type === "application/pdf"),
  );
  const [isLoaded, utils] = usePDFUtils();

  // ── 2. State ──────────────────────────────────────────────────────────
  const [isProcessing, setIsProcessing] = useState(false);
  const [totalPages, setTotalPages] = useState(-1);
  const [pages, setPages] = useState<PageState[]>([]);
  const [result, setResult] = useState<{ url: string; filename: string } | null>(null);
  const [dragSourceIndex, setDragSourceIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [layout, setLayout] = useState<{
    columns: number;
    cardWidth: number;
    cardHeight: number;
    rowHeight: number;
  } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // ── 3. Derived ────────────────────────────────────────────────────────
  const fileUploaded: FileUploaded | null = files?.[0] || null;

  const pdfSrcUrl = useMemo(() => {
    if (!fileUploaded?.file) return null;
    return URL.createObjectURL(fileUploaded.file);
  }, [fileUploaded?.file]);

  const activePages = pages.filter((p) => !p.isDeleted);
  const deletedCount = pages.filter(
    (p) => p.isDeleted && p.originalIndex !== -1,
  ).length;
  const blankCount = pages.filter(
    (p) => p.originalIndex === -1 && !p.isDeleted,
  ).length;
  const rotatedCount = pages.filter(
    (p) => !p.isDeleted && p.rotation !== 0,
  ).length;
  const hasChanges =
    deletedCount > 0 ||
    blankCount > 0 ||
    rotatedCount > 0 ||
    activePages.some((p, i) => p.originalIndex !== i);

  const rowCount = layout ? Math.ceil(pages.length / layout.columns) : 0;

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => layout?.rowHeight ?? 200,
    overscan: 1,
    onChange: (instance, sync) => {
      if (sync) {
        instance._willUpdate();
      } else {
        startTransition(() => {
          instance._willUpdate();
        });
      }
    },
  });

  // ── 4. Event handlers ─────────────────────────────────────────────────
  const handleRotatePage = useCallback(
    (index: number, direction: "left" | "right") => {
      const delta = direction === "right" ? 90 : -90;
      setPages((prev) => {
        const newPages = [...prev];
        newPages[index] = {
          ...newPages[index],
          rotation: (newPages[index].rotation + delta + 360) % 360,
        };
        return newPages;
      });
    },
    [],
  );

  const handleDeletePage = useCallback((index: number) => {
    setPages((prev) => {
      const activePages = prev.filter((p) => !p.isDeleted);
      if (activePages.length <= 1) {
        toast.error("Cannot delete the last page");
        return prev;
      }
      const newPages = [...prev];
      newPages[index] = { ...newPages[index], isDeleted: true };
      return newPages;
    });
  }, []);

  const handleRestorePage = useCallback((index: number) => {
    setPages((prev) => {
      const newPages = [...prev];
      newPages[index] = { ...newPages[index], isDeleted: false };
      return newPages;
    });
  }, []);

  const handleInsertBlankPage = useCallback((afterIndex: number) => {
    setPages((prev) => {
      const newPages = [...prev];
      newPages.splice(afterIndex + 1, 0, {
        originalIndex: -1,
        rotation: 0,
        isDeleted: false,
      });
      return newPages;
    });
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDragSourceIndex(index);
    setDropTargetIndex(index);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTargetIndex(index);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (dragSourceIndex === null || dragSourceIndex === index) return;
      setPages((prev) => {
        const newPages = [...prev];
        const [draggedPage] = newPages.splice(dragSourceIndex, 1);
        newPages.splice(index, 0, draggedPage);
        return newPages;
      });
      setDragSourceIndex(null);
      setDropTargetIndex(null);
    },
    [dragSourceIndex],
  );

  const handleDragEnd = useCallback(() => {
    setDragSourceIndex(null);
    setDropTargetIndex(null);
  }, []);

  const handleApplyChanges = useCallback(async () => {
    if (!fileUploaded || isProcessing) return;

    const currentActivePages = pages.filter((p) => !p.isDeleted);
    if (currentActivePages.length === 0) {
      toast.error("No pages left");
      return;
    }

    setIsProcessing(true);

    try {
      const initialBuffer = await fileUploaded.file.arrayBuffer();
      let pdfBytes: Uint8Array = new Uint8Array(initialBuffer);

      const toArrayBuffer = (bytes: Uint8Array): ArrayBuffer => {
        return bytes.buffer.slice(
          bytes.byteOffset,
          bytes.byteOffset + bytes.byteLength,
        ) as ArrayBuffer;
      };

      const pageDimensions = await utils.getPageDimensions(
        toArrayBuffer(pdfBytes),
      );
      const defaultSize = pageDimensions[0] || { width: 612, height: 792 };

      const hasBlankPages = currentActivePages.some(
        (p) => p.originalIndex === -1,
      );

      if (hasBlankPages) {
        const blankPageIndices: number[] = [];
        currentActivePages.forEach((page, idx) => {
          if (page.originalIndex === -1) {
            blankPageIndices.push(idx);
          }
        });

        const realPages = pages.filter(
          (p) => !p.isDeleted && p.originalIndex !== -1,
        );
        const newOrder = realPages.map((p) => p.originalIndex);

        pdfBytes = await utils.reorderPages(toArrayBuffer(pdfBytes), newOrder);

        for (let i = blankPageIndices.length - 1; i >= 0; i--) {
          const blankIdx = blankPageIndices[i];
          pdfBytes = await utils.insertBlankPage(
            toArrayBuffer(pdfBytes),
            blankIdx,
            { width: defaultSize.width, height: defaultSize.height },
          );
        }

        for (let i = 0; i < currentActivePages.length; i++) {
          const page = currentActivePages[i];
          if (page.rotation !== 0) {
            pdfBytes = await utils.rotate(toArrayBuffer(pdfBytes), {
              rotation: page.rotation,
              pages: [i],
            });
          }
        }
      } else {
        const newOrder = currentActivePages.map((p) => p.originalIndex);
        const orderChanged = newOrder.some((orig, idx) => orig !== idx);

        if (orderChanged) {
          pdfBytes = await utils.reorderPages(
            toArrayBuffer(pdfBytes),
            newOrder,
          );
        }

        for (let i = 0; i < currentActivePages.length; i++) {
          const page = currentActivePages[i];
          if (page.rotation !== 0) {
            pdfBytes = await utils.rotate(toArrayBuffer(pdfBytes), {
              rotation: page.rotation,
              pages: [i],
            });
          }
        }
      }

      const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setResult({ url, filename: `organized-${fileUploaded.name}` });
      toast.success("PDF organized successfully!");
    } catch (error) {
      toast.error("Failed to organize PDF");
    } finally {
      setIsProcessing(false);
    }
  }, [fileUploaded, isProcessing, pages, utils]);

  const handleResetChanges = useCallback(() => {
    setPages(
      Array.from({ length: totalPages }, (_, i) => ({
        originalIndex: i,
        rotation: 0,
        isDeleted: false,
      })),
    );
  }, [totalPages]);

  const handleReset = useCallback(() => {
    if (result?.url) URL.revokeObjectURL(result.url);
    setResult(null);
    resetInput();
    setTotalPages(-1);
    setPages([]);
  }, [resetInput, result?.url]);

  const handleDownload = useCallback(() => {
    if (!result) return;
    downloadLink(result.url, result.filename);
  }, [result]);

  // ── 5. Effects ────────────────────────────────────────────────────────

  // Revoke object URL on cleanup
  useEffect(() => {
    return () => {
      if (pdfSrcUrl) URL.revokeObjectURL(pdfSrcUrl);
    };
  }, [pdfSrcUrl]);

  useEffect(() => {
    return () => {
      if (result?.url) URL.revokeObjectURL(result.url);
    };
  }, [result?.url]);

  useEffect(() => {
    if (!result?.url) return;
    URL.revokeObjectURL(result.url);
    setResult(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileUploaded?.id, JSON.stringify(pages)]);

  // Load page count when file is uploaded
  useEffect(() => {
    if (isLoaded && fileUploaded?.file && totalPages === -1) {
      async function countPages() {
        const buffer = await fileUploaded!.file.arrayBuffer();
        const pagesCount = await utils.getTotalPages({ id: "123", buffer });
        setTotalPages(pagesCount);
        setPages(
          Array.from({ length: pagesCount }, (_, i) => ({
            originalIndex: i,
            rotation: 0,
            isDeleted: false,
          })),
        );
      }
      countPages().catch(() => {});
    }
  }, [fileUploaded, isLoaded, totalPages]);

  // Measure container and compute layout dimensions before rendering
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const measure = () => {
      const containerWidth = container.clientWidth - 32; // p-4 = 16px each side
      const cols = Math.max(
        2,
        Math.floor((containerWidth + GAP) / (MIN_CARD_WIDTH + GAP)),
      );
      const cw = Math.floor((containerWidth - GAP * (cols - 1)) / cols);
      const ch = Math.floor(cw * CARD_ASPECT);
      setLayout({ columns: cols, cardWidth: cw, cardHeight: ch, rowHeight: ch + GAP });
    };

    const observer = new ResizeObserver(measure);
    observer.observe(container);
    measure();
    return () => observer.disconnect();
  }, [fileUploaded]);

  // ── 6. Render ─────────────────────────────────────────────────────────

  if (files.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <UploadButtonFull
          multiple={false}
          accept="application/pdf"
          title="Upload PDF File"
          subtitle="Click to select a PDF to organize"
          label="Upload PDF"
          fileInputRef={fileInputRef}
          handleFileUpload={handleFileUpload}
          triggerFileInput={triggerFileInput}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <div className="flex items-center gap-3">
          <LayoutGridIcon className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Organize PDF</h2>
          <span className="text-sm text-muted-foreground">
            {activePages.length} pages
          </span>
        </div>

        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button variant="outline" size="sm" onClick={handleResetChanges}>
              Reset Changes
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleReset}>
            Start Over
          </Button>
          {result ? (
            <Button onClick={handleDownload} size="sm">
              Download
              <DownloadIcon className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleApplyChanges}
              disabled={isProcessing || !hasChanges}
              size="sm"
            >
              {isProcessing ? (
                <>
                  Processing...
                  <Loader2Icon className="w-4 h-4 animate-spin ml-2" />
                </>
              ) : (
                <>
                  Apply Changes
                  <ArrowRightIcon className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Changes summary */}
      {hasChanges && (
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 text-sm">
          <span className="text-blue-800 dark:text-blue-200">
            Changes: {deletedCount > 0 && `${deletedCount} deleted, `}
            {blankCount > 0 && `${blankCount} blank pages added, `}
            {rotatedCount > 0 && `${rotatedCount} rotated`}
            {deletedCount === 0 &&
              blankCount === 0 &&
              rotatedCount === 0 &&
              "Pages reordered"}
          </span>
        </div>
      )}

      {/* Grid view of pages (virtualized) */}
      <div ref={scrollContainerRef} className="flex-1 overflow-auto p-4">
        {totalPages >= 1 && layout && pdfSrcUrl ? (
          <PDFDocumentProvider src={pdfSrcUrl}>
            <div
              style={{
                height: virtualizer.getTotalSize(),
                width: "100%",
                position: "relative",
              }}
            >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const startIndex = virtualRow.index * layout.columns;
              const rowPages = pages.slice(
                startIndex,
                startIndex + layout.columns,
              );

              return (
                <div
                  key={virtualRow.key}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: `repeat(${layout.columns}, ${layout.cardWidth}px)`,
                      gap: `${GAP}px`,
                    }}
                  >
                    {rowPages.map((page, colIndex) => {
                      const index = startIndex + colIndex;
                      return (
                        <div
                          key={`${page.originalIndex}-${index}`}
                          draggable={!page.isDeleted}
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDrop={(e) => handleDrop(e, index)}
                          onDragEnd={handleDragEnd}
                          className={`group relative bg-white dark:bg-gray-900 border-2 rounded-lg overflow-hidden transition-all ${
                            page.isDeleted
                              ? "opacity-50 border-red-300 dark:border-red-700"
                              : dragSourceIndex === index
                                ? "opacity-40 border-blue-500"
                                : dropTargetIndex === index &&
                                    dragSourceIndex !== null
                                  ? "border-blue-500 shadow-lg"
                                  : "border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500"
                          }`}
                          style={{
                            width: layout.cardWidth,
                            height: layout.cardHeight,
                          }}
                        >
                          {/* Drag handle */}
                          {!page.isDeleted && (
                            <div className="absolute top-1 left-1 z-10 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
                              <GripVerticalIcon className="w-4 h-4 text-gray-400" />
                            </div>
                          )}

                          {/* Page number badge */}
                          <div className="absolute top-1 right-1 z-10 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                            {page.originalIndex === -1 ? "Blank" : index + 1}
                          </div>

                          {/* Page preview */}
                          <div
                            className="bg-gray-100 dark:bg-gray-800 overflow-hidden"
                            style={{
                              width: layout.cardWidth,
                              height: layout.cardHeight,
                              transform: `rotate(${page.rotation}deg)`,
                            }}
                          >
                            {page.originalIndex === -1 ? (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                <PlusIcon className="w-8 h-8" />
                              </div>
                            ) : (
                              <PDFPageThumbnail
                                pageIndex={page.originalIndex}
                                width={layout.cardWidth}
                              />
                            )}
                          </div>

                          {/* Action buttons */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {page.isDeleted ? (
                              <Button
                                size="sm"
                                variant="secondary"
                                className="w-full h-7 text-xs"
                                onClick={() => handleRestorePage(index)}
                              >
                                Restore
                              </Button>
                            ) : (
                              <div className="flex gap-1 justify-center">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="h-7 w-7 p-0"
                                  onClick={() =>
                                    handleRotatePage(index, "left")
                                  }
                                  title="Rotate Left"
                                >
                                  <RotateCcwIcon className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="h-7 w-7 p-0"
                                  onClick={() =>
                                    handleRotatePage(index, "right")
                                  }
                                  title="Rotate Right"
                                >
                                  <RotateCwIcon className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="h-7 w-7 p-0"
                                  onClick={() => handleInsertBlankPage(index)}
                                  title="Insert Blank Page"
                                >
                                  <PlusIcon className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-7 w-7 p-0"
                                  onClick={() => handleDeletePage(index)}
                                  title="Delete Page"
                                >
                                  <Trash2Icon className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>

                          {/* Rotation indicator */}
                          {page.rotation !== 0 && !page.isDeleted && (
                            <div className="absolute top-1 left-6 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded">
                              {page.rotation}°
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            </div>
          </PDFDocumentProvider>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2Icon className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading pages...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
