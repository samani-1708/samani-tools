"use client";

import { FileUploaded, useFileUpload } from "@/app/common/hooks";
import { PDFStatePending } from "@/app/common/pdf-viewer/pdf-states";
import { createPDFBlobURL, downloadLink } from "@/app/common/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CropIcon,
  DownloadIcon,
  RotateCcwIcon,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { usePDFUtils } from "@/app/pdf/common/use-pdf-utils.hooks";
import { CropBox } from "@/app/pdf/common/types";
import { PageDimensionInfo } from "@/app/pdf/common/pdf-lib";
import { PDFToolLayout } from "../common/layouts/pdf-tool-layout";
import { ProcessingButton } from "../common/layouts/processing-button";

const ViewPDF = dynamic(() => import("@/app/common/pdf-viewer/pdf-viewer"), {
  ssr: false,
  loading: () => <PDFStatePending header="Loading" subHeader="" />,
});

type ApplyMode = "all" | "current";

interface CropState {
  // Crop box as percentage of page dimensions (0-100)
  x: number;
  y: number;
  width: number;
  height: number;
}

const presets = {
  '5p': { x: 5, y: 5, width: 90, height: 90 },
  '10p': { x: 10, y: 10, width: 80, height: 80 },
  '0p': { x: 0, y: 0, width: 100, height: 100 }
} as const;


function getPreset(cropState: CropState): keyof typeof presets | undefined {
  for (const [key, preset] of Object.entries(presets)) {
    if (
      preset.x === cropState.x &&
      preset.y === cropState.y &&
      preset.width === cropState.width &&
      preset.height === cropState.height
    ) {
      return (key as keyof typeof presets);
    }
  }
  return undefined;
}
export function PageClient() {
  const {
    files,
    fileInputRef,
    handleFileUpload,
    triggerFileInput,
    resetInput,
  } = useFileUpload((f) =>
    Array.from(f).filter((file) => file.type === "application/pdf"),
  );

  const [isLoaded, pdfUtils] = usePDFUtils();
  const [isCropping, setIsCropping] = useState(false);

  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageDimensions, setPageDimensions] = useState<PageDimensionInfo[]>([]);

  const [applyMode, setApplyMode] = useState<ApplyMode>("all");

  const [crop, setCrop] = useState<CropState>(presets['10p']);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cropStart, setCropStart] = useState<CropState>(presets['10p']);
  const [result, setResult] = useState<{ url: string; filename: string } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const fileUploaded: FileUploaded | null = files?.[0] || null;

  const currentPageDims = pageDimensions[currentPage];

  // Convert percentage crop to points for the current page
  const getCropBoxInPoints = useCallback((): CropBox | null => {
    if (!currentPageDims) return null;

    const pageWidth = currentPageDims.width;
    const pageHeight = currentPageDims.height;

    return {
      x: (crop.x / 100) * pageWidth,
      y: (crop.y / 100) * pageHeight,
      width: (crop.width / 100) * pageWidth,
      height: (crop.height / 100) * pageHeight,
    };
  }, [crop, currentPageDims]);

  const handleCrop = async () => {
    if (!fileUploaded || !isLoaded) return;

    const cropBox = getCropBoxInPoints();
    if (!cropBox) {
      toast.error("Unable to calculate crop dimensions");
      return;
    }

    setIsCropping(true);

    try {
      const buffer = await fileUploaded.file.arrayBuffer();

      const pages = applyMode === "current" ? [currentPage] : undefined;

      const croppedBytes = await pdfUtils.crop(buffer, {
        cropBox,
        pages,
      });

      const url = createPDFBlobURL(croppedBytes);
      const originalName = fileUploaded.name.replace(/\.pdf$/i, "");
      setResult({ url, filename: `${originalName}-cropped.pdf` });

      toast.success("PDF cropped successfully!");
    } catch (error) {
      toast.error("Failed to crop PDF");
    } finally {
      setIsCropping(false);
    }
  };

  const handleReset = () => {
    if (result?.url) URL.revokeObjectURL(result.url);
    setResult(null);
    setCrop(presets['10p']);
    resetInput();
    setTotalPages(0);
    setCurrentPage(0);
    setPageDimensions([]);
  };

  const handleDownload = () => {
    if (!result) return;
    downloadLink(result.url, result.filename);
  };

  // Mouse event handlers for crop box manipulation
  const handleMouseDown = (e: React.MouseEvent, handle?: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (handle) {
      setIsResizing(true);
      setResizeHandle(handle);
    } else {
      setIsDragging(true);
    }

    setDragStart({ x: e.clientX, y: e.clientY });
    setCropStart({ ...crop });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!containerRef.current || (!isDragging && !isResizing)) return;

      const rect = containerRef.current.getBoundingClientRect();
      const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100;
      const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100;

      if (isDragging) {
        let newX = cropStart.x + deltaX;
        let newY = cropStart.y - deltaY;

        newX = Math.max(0, Math.min(100 - cropStart.width, newX));
        newY = Math.max(0, Math.min(100 - cropStart.height, newY));

        setCrop((prev) => ({ ...prev, x: newX, y: newY }));
      } else if (isResizing && resizeHandle) {
        let newCrop = { ...cropStart };

        if (resizeHandle.includes("e")) {
          newCrop.width = Math.max(
            5,
            Math.min(100 - cropStart.x, cropStart.width + deltaX),
          );
        }
        if (resizeHandle.includes("w")) {
          const newWidth = Math.max(5, cropStart.width - deltaX);
          const newX = cropStart.x + (cropStart.width - newWidth);
          if (newX >= 0) {
            newCrop.x = newX;
            newCrop.width = newWidth;
          }
        }
        if (resizeHandle.includes("n")) {
          newCrop.height = Math.max(
            5,
            Math.min(100 - cropStart.y, cropStart.height - deltaY),
          );
        }
        if (resizeHandle.includes("s")) {
          const newHeight = Math.max(5, cropStart.height + deltaY);
          const newY = cropStart.y + (cropStart.height - newHeight);
          if (newY >= 0) {
            newCrop.y = newY;
            newCrop.height = newHeight;
          }
        }

        setCrop(newCrop);
      }
    },
    [isDragging, isResizing, dragStart, cropStart, resizeHandle],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  const goToPage = (page: number) => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
    }
  };

  const canCrop = fileUploaded && isLoaded && !isCropping && totalPages > 0;

  const pagesToShow = [currentPage];

  const presetMatching = getPreset(crop);

  // Load page dimensions when file is uploaded
  useEffect(() => {
    if (!fileUploaded || !isLoaded) return;

    async function loadDimensions() {
      try {
        const buffer = await fileUploaded!.file.arrayBuffer();
        const dims = await pdfUtils.getPageDimensions(buffer);
        setPageDimensions(dims);
        setTotalPages(dims.length);
        setCurrentPage(0);
      } catch (error) {

      }
    }

    loadDimensions();
  }, [fileUploaded, isLoaded, pdfUtils]);

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

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
  }, [fileUploaded?.id, applyMode, currentPage, crop.x, crop.y, crop.width, crop.height]);

  return (
    <PDFToolLayout
      showUpload={files.length === 0}
      uploadProps={{
        title: "Upload PDF File",
        subtitle: "Click to select a PDF to crop",
        label: "Upload PDF",
        fileInputRef,
        handleFileUpload,
        triggerFileInput,
      }}
      sidebarTitle="Crop PDF"
      sidebarWidth="sm"
      disabled={isCropping}
      content={
        fileUploaded ? (
        <div className="flex flex-col items-center gap-4">
          {/* PDF pages with crop overlay */}
          <div className="flex flex-wrap gap-6 justify-center items-start">
            {pagesToShow.map((pageIndex) => (
              <div
                key={pageIndex}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                {/* PDF thumbnail container */}
                <div className="relative aspect-[3/4] bg-gray-100 dark:bg-gray-800 rounded overflow-hidden w-full max-w-[16rem]">
                  {/* PDF Page */}
                  <ViewPDF
                    src={fileUploaded!.file}
                    range={[pageIndex]}
                    width={256}
                    forceRefresh
                    defaultOverrides={{
                      pageBetweenMargin: "0px",
                      pageBoxShadow: "none",
                    }}
                  />

                  {/* Crop overlay */}
                  {pageIndex === currentPage && (
                    <div
                      ref={containerRef}
                      className="absolute inset-0"
                      style={{ pointerEvents: "none" }}
                    >
                      {/* Darkened area outside crop box */}
                      <div
                        className="absolute inset-0 bg-black/50"
                        style={{
                          clipPath: `polygon(
                            0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
                            ${crop.x}% ${100 - crop.y - crop.height}%,
                            ${crop.x}% ${100 - crop.y}%,
                            ${crop.x + crop.width}% ${100 - crop.y}%,
                            ${crop.x + crop.width}% ${100 - crop.y - crop.height}%,
                            ${crop.x}% ${100 - crop.y - crop.height}%
                          )`,
                        }}
                      />

                      {/* Crop box */}
                      <div
                        className="absolute border-2 border-primary bg-transparent cursor-move"
                        style={{
                          left: `${crop.x}%`,
                          bottom: `${crop.y}%`,
                          width: `${crop.width}%`,
                          height: `${crop.height}%`,
                          pointerEvents: "auto",
                        }}
                        onMouseDown={(e) => handleMouseDown(e)}
                      >
                        {/* Resize handles */}
                        {["nw", "n", "ne", "e", "se", "s", "sw", "w"].map(
                          (handle) => (
                            <div
                              key={handle}
                              className={cn(
                                "absolute w-3 h-3 bg-primary border border-white rounded-sm",
                                handle.includes("n") &&
                                  "top-0 -translate-y-1/2",
                                handle.includes("s") &&
                                  "bottom-0 translate-y-1/2",
                                handle.includes("e") &&
                                  "right-0 translate-x-1/2",
                                handle.includes("w") &&
                                  "left-0 -translate-x-1/2",
                                handle === "n" &&
                                  "left-1/2 -translate-x-1/2 cursor-ns-resize",
                                handle === "s" &&
                                  "left-1/2 -translate-x-1/2 cursor-ns-resize",
                                handle === "e" &&
                                  "top-1/2 -translate-y-1/2 cursor-ew-resize",
                                handle === "w" &&
                                  "top-1/2 -translate-y-1/2 cursor-ew-resize",
                                handle === "nw" && "cursor-nwse-resize",
                                handle === "se" && "cursor-nwse-resize",
                                handle === "ne" && "cursor-nesw-resize",
                                handle === "sw" && "cursor-nesw-resize",
                              )}
                              onMouseDown={(e) => handleMouseDown(e, handle)}
                            />
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Page number */}
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Page {pageIndex + 1}
                </p>
              </div>
            ))}
          </div>

          {/* Page navigation */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 0}
              >
                <ArrowLeftIcon className="w-4 h-4" />
              </Button>
              <span className="text-sm">
                Page {currentPage + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
              >
                <ArrowRightIcon className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
        ) : null
      }
      controls={
        <div className="space-y-4 mb-6">
          <div className="space-y-2">
            <Label>Apply to</Label>
            <Select
              value={applyMode}
              onValueChange={(v) => setApplyMode(v as ApplyMode)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Pages</SelectItem>
                <SelectItem value="current">Current Page Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Crop dimensions (percentage) */}
          <div className="space-y-2">
            <Label>Crop Area (%)</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">
                  Left (X)
                </Label>
                <Input
                  type="number"
                  value={Math.round(crop.x)}
                  onChange={(e) =>
                    setCrop((prev) => ({
                      ...prev,
                      x: Math.max(
                        0,
                        Math.min(100 - prev.width, Number(e.target.value)),
                      ),
                    }))
                  }
                  min={0}
                  max={100}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Bottom (Y)
                </Label>
                <Input
                  type="number"
                  value={Math.round(crop.y)}
                  onChange={(e) =>
                    setCrop((prev) => ({
                      ...prev,
                      y: Math.max(
                        0,
                        Math.min(100 - prev.height, Number(e.target.value)),
                      ),
                    }))
                  }
                  min={0}
                  max={100}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Width</Label>
                <Input
                  type="number"
                  value={Math.round(crop.width)}
                  onChange={(e) =>
                    setCrop((prev) => ({
                      ...prev,
                      width: Math.max(
                        5,
                        Math.min(100 - prev.x, Number(e.target.value)),
                      ),
                    }))
                  }
                  min={5}
                  max={100}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Height</Label>
                <Input
                  type="number"
                  value={Math.round(crop.height)}
                  onChange={(e) =>
                    setCrop((prev) => ({
                      ...prev,
                      height: Math.max(
                        5,
                        Math.min(100 - prev.y, Number(e.target.value)),
                      ),
                    }))
                  }
                  min={5}
                  max={100}
                />
              </div>
            </div>
          </div>

          {/* Current page dimensions info */}
          {currentPageDims && (
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                Page size: {Math.round(currentPageDims.width)} x{" "}
                {Math.round(currentPageDims.height)} pts
              </p>
              {getCropBoxInPoints() && (
                <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">
                  Crop box: {Math.round(getCropBoxInPoints()!.width)} x{" "}
                  {Math.round(getCropBoxInPoints()!.height)} pts
                </p>
              )}
            </div>
          )}

          {/* Preset buttons */}
          <div className="space-y-2">
            <Label>Presets</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={presetMatching === '5p' ? "default" : "ghost" }
                size="sm"
                onClick={() => setCrop(presets['5p'])}
              >
                5% margin
              </Button>
              <Button
                variant={presetMatching === '10p' ? "default" : "ghost" }
                size="sm"
                onClick={() => setCrop(presets['10p'])}
              >
                10% margin
              </Button>
              <Button
                variant={presetMatching === '0p' ? "default" : "ghost" }
                size="sm"
                onClick={() => setCrop(presets['0p'])}
              >
                Full page
              </Button>
            </div>
          </div>
        </div>
      }
      actions={
        result ? (
          <Button onClick={handleDownload} className="w-full h-10 sm:h-12 text-sm sm:text-base font-semibold" aria-label="Download cropped PDF">
            Download
            <DownloadIcon className="w-5 h-5 ml-2" />
          </Button>
        ) : (
          <ProcessingButton
            onClick={handleCrop}
            disabled={!canCrop}
            isProcessing={isCropping}
            label="Crop PDF"
            processingLabel="Cropping..."
            icon={<CropIcon className="w-5 h-5" />}
          />
        )
      }
      secondaryActions={
        <>
          <Button variant="outline" onClick={handleReset} className="h-10 w-10 p-0" aria-label="Start over">
            <RotateCcwIcon className="w-4 h-4" />
          </Button>
          {!isLoaded && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Loading PDF tools...
            </p>
          )}
        </>
      }
    />
  );
}
