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
import { cn } from "@/lib/utils";
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
  { label: "3840px (4K)", value: "3840" },
  { label: "2560px (QHD)", value: "2560" },
  { label: "1920px (HD)", value: "1920" },
  { label: "1280px", value: "1280" },
  { label: "800px", value: "800" },
];

const formatOptions = [
  { label: "Auto (smallest)", value: "auto" },
  { label: "Keep original format", value: "original" },
  { label: "JPEG", value: "image/jpeg" },
  { label: "WebP", value: "image/webp" },
  { label: "PNG", value: "image/png" },
];

type QualityPreset = { label: string; quality: number; description: string };

const qualityPresets: QualityPreset[] = [
  { label: "Original", quality: 100, description: "Same as input" },
  { label: "High", quality: 90, description: "Near-original" },
  { label: "Balanced", quality: 70, description: "Smaller file" },
  { label: "Low", quality: 40, description: "Smallest file" },
];

function resolveInputFormat(file: File): EncodableImageFormat {
  const mime = file.type;
  if (mime === "image/jpeg" || mime === "image/png" || mime === "image/webp" || mime === "image/avif" || mime === "image/tiff") {
    return mime as EncodableImageFormat;
  }
  return "image/jpeg";
}

function resolveOutputExt(format: EncodableImageFormat): string {
  switch (format) {
    case "image/webp": return "webp";
    case "image/png": return "png";
    case "image/avif": return "avif";
    case "image/tiff": return "tiff";
    case "image/jpeg":
    default: return "jpg";
  }
}

export function PageClient() {
  const [quality, setQuality] = useState(100);
  const [maxSize, setMaxSize] = useState("0");
  const [outputFormat, setOutputFormat] = useState("auto");
  const [isCompressing, setIsCompressing] = useState(false);
  const [originalDims, setOriginalDims] = useState<{ width: number; height: number } | null>(null);
  const [result, setResult] = useState<{ blob: Blob; size: number; format: EncodableImageFormat; timeMs: number; width: number; height: number } | null>(null);

  const [isLoaded, imageUtils] = useImageUtils();
  const { files, fileInputRef, handleFileUpload, triggerFileInput, resetInput } = useFileUpload(filterImageFiles);

  const file = files[0]?.file ?? null;
  const originalSize = file?.size ?? 0;
  const canCompress = Boolean(file) && !isCompressing && isLoaded;
  const compressionRatio =
    result && originalSize > 0
      ? (((originalSize - result.size) / originalSize) * 100).toFixed(1)
      : null;
  const sizeIncreased = result ? result.size >= originalSize : false;

  async function handleCompress() {
    if (!file || isCompressing) return;

    setIsCompressing(true);
    setResult(null);

    try {
      const support = await imageUtils.getEncodeSupport();
      let format: EncodableImageFormat;

      if (outputFormat === "auto") {
        format = support["image/webp"] ? "image/webp" : "image/jpeg";
      } else if (outputFormat === "original") {
        format = resolveInputFormat(file);
      } else {
        format = outputFormat as EncodableImageFormat;
      }

      const limit = Number(maxSize);

      const t0 = performance.now();
      const blob = await imageUtils.compress(file, {
        quality: quality / 100,
        maxWidth: limit > 0 ? limit : undefined,
        maxHeight: limit > 0 ? limit : undefined,
        format,
      });
      const timeMs = Math.round(performance.now() - t0);

      // Read output dimensions
      let outWidth = originalDims?.width ?? 0;
      let outHeight = originalDims?.height ?? 0;
      try {
        const bmp = await createImageBitmap(blob);
        outWidth = bmp.width;
        outHeight = bmp.height;
        bmp.close();
      } catch {}

      setResult({ blob, size: blob.size, format, timeMs, width: outWidth, height: outHeight });

      toast.success(`Compressed in ${timeMs < 1000 ? `${timeMs}ms` : `${(timeMs / 1000).toFixed(1)}s`}`);
    } catch (error) {
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
    const ext = resolveOutputExt(result.format);
    downloadBlob(result.blob, `${getBaseName(file.name)}-compressed.${ext}`);
  }

  useEffect(() => {
    if (!file) {
      setOriginalDims(null);
      return;
    }
    let cancelled = false;
    imageUtils.readDimensions(file).then((dims) => {
      if (!cancelled) setOriginalDims(dims);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [file, imageUtils]);

  useEffect(() => {
    if (!result) return;
    setResult(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quality, maxSize, outputFormat, file]);

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
          <div className="text-sm text-muted-foreground mb-4 space-y-0.5">
            <p>Original: <span className="font-medium text-foreground">{formatBytes(originalSize)}</span></p>
            {originalDims && (
              <p>Dimensions: <span className="font-medium text-foreground">{originalDims.width} x {originalDims.height}</span></p>
            )}
          </div>

          {/* Quality presets */}
          <div className="space-y-2 mb-4">
            <Label>Compression Level</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {qualityPresets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setQuality(preset.quality)}
                  disabled={isCompressing}
                  className={cn(
                    "rounded-md border px-2.5 py-2 text-left transition-colors",
                    quality === preset.quality
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:bg-muted"
                  )}
                >
                  <span className="text-sm font-medium block">{preset.label}</span>
                  <span className="text-xs text-muted-foreground">{preset.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quality slider */}
          <QualitySlider value={quality} onChange={setQuality} disabled={isCompressing} />

          {/* Output format */}
          <div className="space-y-2 mb-5 mt-4">
            <Label htmlFor="output-format">Output Format</Label>
            <Select value={outputFormat} onValueChange={setOutputFormat} disabled={isCompressing}>
              <SelectTrigger id="output-format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {formatOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Max dimension */}
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
            {maxSize !== "0" && (
              <p className="text-xs text-muted-foreground">
                Images larger than {maxSize}px will be downscaled
              </p>
            )}
          </div>

          {/* Results */}
          {result && compressionRatio && (
            <div className={cn(
              "border rounded-lg p-4 mb-5",
              sizeIncreased
                ? "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800"
                : "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
            )}>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Original:</span>
                  <span>{formatBytes(originalSize)}{originalDims ? ` (${originalDims.width}x${originalDims.height})` : ""}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Compressed:</span>
                  <span>{formatBytes(result.size)}{result.width ? ` (${result.width}x${result.height})` : ""}</span>
                </div>
                <div className={cn(
                  "flex justify-between font-medium pt-1 mt-2",
                  sizeIncreased
                    ? "border-t border-yellow-200 dark:border-yellow-800"
                    : "border-t border-green-200 dark:border-green-800"
                )}>
                  <span className="text-muted-foreground">Reduction:</span>
                  <span className={sizeIncreased ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400"}>
                    {sizeIncreased
                      ? "File already optimized"
                      : Number(compressionRatio) > 0 ? `-${compressionRatio}%` : "No reduction"
                    }
                  </span>
                </div>
                <div className="flex justify-between text-xs pt-1">
                  <span className="text-muted-foreground">Format:</span>
                  <span className="uppercase">{resolveOutputExt(result.format)}</span>
                </div>
                <div className="flex justify-between text-xs">
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
            Download
            <DownloadIcon className="w-5 h-5 ml-2" />
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
          Start Over
          <RotateCcwIcon className="w-4 h-4 ml-2" />
        </Button>
      }
    />
  );
}
