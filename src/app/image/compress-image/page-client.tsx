"use client";

import { useFileUpload } from "@/app/common/hooks";
import { filterImageFiles } from "@/app/image/common/filter-image-files";
import { useImageUtils } from "@/app/image/common/use-image-utils.hooks";
import { PDFToolLayout } from "@/app/pdf/common/layouts/pdf-tool-layout";
import { ProcessingButton } from "@/app/pdf/common/layouts/processing-button";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DownloadIcon, RotateCcwIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  EncodableImageFormat,
  downloadBlob,
  formatBytes,
  getBaseName,
} from "../common/image-utils";
import { QualitySlider } from "../common/quality-slider";

const sizeOptions = [
  { label: "Keep original", value: "0" },
  { label: "2560px", value: "2560" },
  { label: "1920px", value: "1920" },
  { label: "1280px", value: "1280" },
  { label: "800px", value: "800" },
];

export function PageClient() {
  // 1) Props
  // No props for this page component.

  // 2) State
  const [quality, setQuality] = useState(80);
  const [maxSize, setMaxSize] = useState("1920");
  const [isCompressing, setIsCompressing] = useState(false);
  const [result, setResult] = useState<{ blob: Blob; size: number; format: EncodableImageFormat; timeMs: number } | null>(null);

  // 3) Custom hooks
  const [isLoaded, imageUtils] = useImageUtils();
  const { files, fileInputRef, handleFileUpload, triggerFileInput, resetInput } = useFileUpload(filterImageFiles);

  // 4) Derived props and state
  const file = files[0]?.file ?? null;
  const originalSize = file?.size ?? 0;
  const canCompress = Boolean(file) && !isCompressing && isLoaded;
  const compressionRatio =
    result && originalSize > 0
      ? (((originalSize - result.size) / originalSize) * 100).toFixed(1)
      : null;

  // 5) Utils
  // No local utility helpers needed.

  // 6) Handlers
  async function handleCompress() {
    if (!file || isCompressing) return;

    setIsCompressing(true);
    setResult(null);

    try {
      const support = await imageUtils.getEncodeSupport();
      const preferredFormat: EncodableImageFormat = support["image/webp"] ? "image/webp" : "image/jpeg";
      const limit = Number(maxSize);

      const t0 = performance.now();
      const blob = await imageUtils.compress(file, {
        quality: quality / 100,
        maxWidth: limit > 0 ? limit : undefined,
        maxHeight: limit > 0 ? limit : undefined,
        format: preferredFormat,
      });
      const timeMs = Math.round(performance.now() - t0);

      setResult({ blob, size: blob.size, format: preferredFormat, timeMs });

      toast.success(`Compressed in ${timeMs < 1000 ? `${timeMs}ms` : `${(timeMs / 1000).toFixed(1)}s`}`);
    } catch (error) {
      console.error(error);
      toast.error((error as Error).message || "Compression failed");
    } finally {
      setIsCompressing(false);
    }
  }

  function handleReset() {
    setResult(null);
    resetInput();
  }

  function handleDownload() {
    if (!file || !result) return;
    const ext = result.format === "image/webp" ? "webp" : "jpg";
    downloadBlob(result.blob, `${getBaseName(file.name)}-compressed.${ext}`);
  }

  // 7) Effects
  useEffect(() => {
    if (!result) return;
    setResult(null);
  }, [quality, maxSize, file]);

  // 8) Render
  return (
    <PDFToolLayout
      showUpload={files.length === 0}
      uploadProps={{
        title: "Upload Image",
        subtitle: "Choose an image to compress",
        label: "Upload Image",
        accept: "image/*,.heic,.heif",
        fileInputRef,
        handleFileUpload,
        triggerFileInput,
      }}
      sidebarTitle="Compress Image"
      sidebarWidth="sm"
      disabled={isCompressing}
      content={
        file ? (
          <div className="flex flex-wrap gap-6 justify-center items-start">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 w-full max-w-[16rem]">
              <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center mb-3 overflow-hidden">
                {files[0]?.url ? (
                  <img
                    src={files[0].url}
                    alt={file.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-3xl text-muted-foreground">🖼</span>
                )}
              </div>
              <p className="text-sm text-center truncate text-gray-700 dark:text-gray-300">
                {file.name}
              </p>
              <p className="text-xs text-center text-muted-foreground mt-1">
                {formatBytes(result?.size ?? originalSize)}
              </p>
            </div>
          </div>
        ) : null
      }
      controls={
        <>
          <div className="text-sm text-muted-foreground mb-4">
            <p>Original size: {formatBytes(originalSize)}</p>
          </div>

          <QualitySlider value={quality} onChange={setQuality} disabled={isCompressing} />

          <div className="space-y-2 mb-5">
            <Label htmlFor="max-size">Max Dimension</Label>
            <Select value={maxSize} onValueChange={setMaxSize} disabled={isCompressing}>
              <SelectTrigger id="max-size">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sizeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {result && compressionRatio && (
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-5">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Original:</span>
                  <span>{formatBytes(originalSize)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Compressed:</span>
                  <span>{formatBytes(result.size)}</span>
                </div>
                <div className="flex justify-between font-medium pt-1 border-t border-green-200 dark:border-green-800 mt-2">
                  <span className="text-muted-foreground">Reduction:</span>
                  <span className="text-green-600 dark:text-green-400">
                    {Number(compressionRatio) > 0 ? `-${compressionRatio}%` : "No reduction"}
                  </span>
                </div>
                <div className="flex justify-between text-xs pt-1">
                  <span className="text-muted-foreground">Time:</span>
                  <span>{result.timeMs < 1000 ? `${result.timeMs}ms` : `${(result.timeMs / 1000).toFixed(1)}s`}</span>
                </div>
              </div>
            </div>
          )}

          {!isLoaded && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Loading image engine...
            </p>
          )}

          <div className="flex-1" />
        </>
      }
      actions={
        result ? (
          <Button onClick={handleDownload} className="w-full h-10 sm:h-12 text-sm sm:text-base font-semibold" aria-label="Download compressed image">
            <DownloadIcon className="w-5 h-5 sm:mr-2" />
            <span className="hidden sm:inline">Download</span>
          </Button>
        ) : (
          <ProcessingButton
            onClick={handleCompress}
            disabled={!canCompress}
            isProcessing={isCompressing}
            label="Compress Image"
            processingLabel="Compressing..."
          />
        )
      }
      secondaryActions={
        <Button variant="outline" onClick={handleReset} className="w-full" aria-label="Start over">
          <RotateCcwIcon className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Start Over</span>
        </Button>
      }
    />
  );
}
