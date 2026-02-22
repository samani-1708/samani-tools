"use client";

import { FileUploaded, useFileUpload } from "@/app/common/hooks";
import { PDFStatePending } from "@/app/common/pdf-viewer/pdf-states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DownloadIcon, HashIcon, Loader2Icon, RotateCcwIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { usePDFUtils } from "../common/use-pdf-utils.hooks";
import { downloadLink } from "@/app/common/utils";
import { DEFAULT_PAGE_NUMBER_OPTIONS, PAGE_NUMBER_PRESETS, PageNumberOptions, PageNumberPosition, WatermarkFontFamily } from "../common/types";
import { PDFToolLayout } from "../common/layouts/pdf-tool-layout";
import { ProcessingButton } from "../common/layouts/processing-button";

const ViewPDF = dynamic(() => import("@/app/common/pdf-viewer/pdf-viewer"), {
  ssr: false,
  loading: () => <PDFStatePending header="Loading" subHeader="" />,
});

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

  const [isLoaded, utils] = usePDFUtils();
  const [isProcessing, setIsProcessing] = useState(false);
  const [totalPages, setTotalPages] = useState(-1);
  const [currentPage, setCurrentPage] = useState(0);

  // Page number options
  const [options, setOptions] = useState<PageNumberOptions>(DEFAULT_PAGE_NUMBER_OPTIONS);
  const [customFormat, setCustomFormat] = useState("");
  const [useCustomFormat, setUseCustomFormat] = useState(false);
  const [result, setResult] = useState<{ url: string; filename: string } | null>(null);

  const fileUploaded: FileUploaded | null = files?.[0] || null;

  // Load page count when file is uploaded
  useEffect(() => {
    if (isLoaded && fileUploaded?.file && totalPages === -1) {
      async function countPages() {
        const buffer = await fileUploaded!.file.arrayBuffer();
        const pagesCount = await utils.getTotalPages({ id: "123", buffer });
        setTotalPages(pagesCount);
      }
      countPages().catch(() => {});
    }
  }, [fileUploaded, isLoaded, totalPages]);

  async function handleApplyPageNumbers() {
    if (!fileUploaded || isProcessing) return;

    setIsProcessing(true);

    try {
      const buffer = await fileUploaded.file.arrayBuffer();

      const finalOptions: PageNumberOptions = {
        ...options,
        format: useCustomFormat ? customFormat : options.format,
      };

      const resultBytes = await utils.addPageNumbers(buffer, finalOptions);

      const blob = new Blob([resultBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setResult({ url, filename: `numbered-${fileUploaded.name}` });

      toast.success("Page numbers added successfully!");
    } catch (error) {
      toast.error("Failed to add page numbers");
    } finally {
      setIsProcessing(false);
    }
  }

  function handleReset() {
    if (result?.url) URL.revokeObjectURL(result.url);
    setResult(null);
    resetInput();
    setTotalPages(-1);
    setCurrentPage(0);
    setOptions(DEFAULT_PAGE_NUMBER_OPTIONS);
    setCustomFormat("");
    setUseCustomFormat(false);
  }

  function handleDownload() {
    if (!result) return;
    downloadLink(result.url, result.filename);
  }

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
  }, [fileUploaded?.id, options, customFormat, useCustomFormat]);

  // Get preview text
  const getPreviewText = () => {
    const format = useCustomFormat ? customFormat : options.format;
    const pageNum = (options.startNumber || 1) + currentPage - (options.startPage || 0);
    const totalPagesToNumber = totalPages > 0 ? totalPages - (options.startPage || 0) : 10;

    if (currentPage < (options.startPage || 0)) {
      return "(No number on this page)";
    }

    return format
      .replace(/\{n\}/g, pageNum.toString())
      .replace(/\{p\}/g, totalPagesToNumber.toString());
  };

  return (
    <PDFToolLayout
      showUpload={files.length === 0}
      uploadProps={{
        title: "Upload PDF File",
        subtitle: "Click to select a PDF to add page numbers",
        label: "Upload PDF",
        fileInputRef,
        handleFileUpload,
        triggerFileInput,
      }}
      sidebarTitle="Add Page Numbers"
      sidebarIcon={<HashIcon className="w-5 h-5" />}
      content={
        <div className="flex flex-col items-center gap-4">
          {totalPages >= 1 ? (
            <>
              {/* Page navigation */}
              <div className="flex items-center gap-4 mb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage === totalPages - 1}
                >
                  Next
                </Button>
              </div>

              {/* Current page preview with page number overlay */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 relative">
                <div className="relative w-full max-w-[300px] aspect-[3/4]">
                  <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                    <ViewPDF
                      src={fileUploaded!.file}
                      range={[currentPage]}
                      width={300}
                      forceRefresh
                      defaultOverrides={{
                        pageBetweenMargin: "0px",
                        pageBoxShadow: "none",
                      }}
                    />
                  </div>

                  {/* Page number overlay preview */}
                  <div
                    className="absolute text-xs pointer-events-none"
                    style={{
                      color: options.color,
                      fontSize: `${Math.max(8, (options.fontSize || 12) * 0.4)}px`,
                      ...(options.position === "top-left" && { top: 16, left: 16 }),
                      ...(options.position === "top-right" && { top: 16, right: 16 }),
                      ...(options.position === "bottom-left" && { bottom: 16, left: 16 }),
                      ...(options.position === "bottom-right" && { bottom: 16, right: 16 }),
                    }}
                  >
                    {getPreviewText()}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 w-full max-w-[16rem]">
              <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-800 rounded overflow-hidden mb-3 flex items-center justify-center">
                <Loader2Icon className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
              <p className="text-sm text-center truncate text-gray-700 dark:text-gray-300">
                {fileUploaded?.name}
              </p>
            </div>
          )}
        </div>
      }
      controls={
        <>
          {/* File info */}
          <div className="text-sm text-muted-foreground mb-4">
            <p>Total pages: {totalPages > 0 ? totalPages : "Loading..."}</p>
          </div>

          {/* Page number options */}
          <div className="flex-1 space-y-5">
            {/* Position */}
            <div>
              <Label className="text-sm font-medium">Position</Label>
              <Select
                value={options.position}
                onValueChange={(v) => setOptions({ ...options, position: v as PageNumberPosition })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top-left">Top Left</SelectItem>
                  <SelectItem value="top-right">Top Right</SelectItem>
                  <SelectItem value="bottom-left">Bottom Left</SelectItem>
                  <SelectItem value="bottom-right">Bottom Right</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Format presets */}
            <div>
              <Label className="text-sm font-medium">Format</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {PAGE_NUMBER_PRESETS.map((preset) => (
                  <Button
                    key={preset.format}
                    variant={!useCustomFormat && options.format === preset.format ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setOptions({ ...options, format: preset.format });
                      setUseCustomFormat(false);
                    }}
                  >
                    {preset.label}
                  </Button>
                ))}
                <Button
                  variant={useCustomFormat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUseCustomFormat(true)}
                >
                  Custom
                </Button>
              </div>
              {useCustomFormat && (
                <div className="mt-2">
                  <Input
                    value={customFormat}
                    onChange={(e) => setCustomFormat(e.target.value)}
                    placeholder="e.g., Page {n} of {p}"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use {"{n}"} for page number, {"{p}"} for total pages
                  </p>
                </div>
              )}
            </div>

            {/* Start number */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Start Number</Label>
                <Input
                  type="number"
                  min={1}
                  value={options.startNumber || 1}
                  onChange={(e) => setOptions({ ...options, startNumber: parseInt(e.target.value) || 1 })}
                  className="mt-2"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Start from Page</Label>
                <Input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={(options.startPage || 0) + 1}
                  onChange={(e) => setOptions({ ...options, startPage: Math.max(0, parseInt(e.target.value) - 1) || 0 })}
                  className="mt-2"
                />
              </div>
            </div>

            {/* Font settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Font Size</Label>
                <Input
                  type="number"
                  min={6}
                  max={72}
                  value={options.fontSize || 12}
                  onChange={(e) => setOptions({ ...options, fontSize: parseInt(e.target.value) || 12 })}
                  className="mt-2"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Color</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    type="color"
                    value={options.color || "#000000"}
                    onChange={(e) => setOptions({ ...options, color: e.target.value })}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    type="text"
                    value={options.color || "#000000"}
                    onChange={(e) => setOptions({ ...options, color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Font family */}
            <div>
              <Label className="text-sm font-medium">Font Family</Label>
              <Select
                value={options.fontFamily || "Helvetica"}
                onValueChange={(v) => setOptions({ ...options, fontFamily: v as WatermarkFontFamily })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Helvetica">Helvetica</SelectItem>
                  <SelectItem value="Times-Roman">Times Roman</SelectItem>
                  <SelectItem value="Courier">Courier</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </>
      }
      actions={
        result ? (
          <Button onClick={handleDownload} className="w-full h-10 sm:h-12 text-sm sm:text-base font-semibold" aria-label="Download numbered PDF">
            Download
            <DownloadIcon className="w-5 h-5 ml-2" />
          </Button>
        ) : (
          <ProcessingButton
            onClick={handleApplyPageNumbers}
            disabled={totalPages <= 0}
            isProcessing={isProcessing}
            label="Add Page Numbers"
            processingLabel="Adding..."
          />
        )
      }
      secondaryActions={
        <Button variant="outline" onClick={handleReset} className="h-10 w-10 p-0" aria-label="Start over">
          <RotateCcwIcon className="w-4 h-4" />
        </Button>
      }
    />
  );
}
