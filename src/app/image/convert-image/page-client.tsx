"use client";

import { useFileUpload } from "@/app/common/hooks";
import { filterImageFiles } from "@/app/image/common/filter-image-files";
import { ConversionMode, useImageUtils } from "@/app/image/common/use-image-utils.hooks";
import { PDFToolLayout } from "@/app/pdf/common/layouts/pdf-tool-layout";
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
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  EncodableImageFormat,
  IMAGE_FORMAT_OPTIONS,
  OutputImageFormat,
  downloadBlob,
  formatBytes,
  getBaseName,
} from "../common/image-utils";
import { QualitySlider } from "../common/quality-slider";

const encodableFormats = IMAGE_FORMAT_OPTIONS.filter(
  (f): f is { mime: EncodableImageFormat; label: string; ext: string } =>
    f.mime !== "image/heic",
);

const CONVERSION_MODES: Array<{ value: ConversionMode; label: string; helper: string }> = [
  { value: "balanced", label: "Balanced", helper: "Recommended: good quality + controlled size." },
  { value: "fast", label: "Fast", helper: "Faster conversion, stronger size limits." },
  { value: "max_quality", label: "Max Quality", helper: "Best quality, larger files and slower processing." },
];

export function PageClient() {
  // 1) Props
  // No props for this page component.

  // 2) State
  const [targetFormat, setTargetFormat] = useState<OutputImageFormat>("image/jpeg");
  const [quality, setQuality] = useState(90);
  const [mode, setMode] = useState<ConversionMode>("balanced");
  const [isConverting, setIsConverting] = useState(false);
  const [supported, setSupported] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null);
  const [conversionNote, setConversionNote] = useState<string | null>(null);

  // 3) Custom hooks
  const [isLoaded, imageUtils] = useImageUtils();
  const { files, fileInputRef, handleFileUpload, triggerFileInput, resetInput } = useFileUpload(filterImageFiles);

  // 4) Derived props and state
  const file = files[0]?.file;
  const showQuality = targetFormat !== "image/png" && targetFormat !== "image/tiff" && targetFormat !== "image/heic";
  const canConvert = Boolean(file) && !isConverting && isLoaded;
  const resultExt = useMemo(() => {
    return IMAGE_FORMAT_OPTIONS.find((item) => item.mime === targetFormat)?.ext || "img";
  }, [targetFormat]);

  // 5) Utils
  // No local utility helpers needed.

  // 6) Handlers
  async function handleConvert() {
    if (!file || isConverting) return;

    if (targetFormat === "image/heic") {
      toast.error("HEIC encoding is not available in browser canvas. Use JPG/PNG/WEBP/AVIF output.");
      return;
    }

    if (!supported[targetFormat]) {
      toast.error(`${targetFormat} is not supported by your current browser.`);
      return;
    }

    setIsConverting(true);
    setConversionNote(null);
    if (result?.url) URL.revokeObjectURL(result.url);
    setResult(null);

    try {
      const blob = await imageUtils.convert(file, {
        format: targetFormat,
        quality: showQuality ? quality / 100 : undefined,
        mode,
      });
      const url = URL.createObjectURL(blob);
      setResult({ blob, url });

      try {
        const [sourceDims, outputDims] = await Promise.all([
          imageUtils.readDimensions(file),
          imageUtils.readDimensions(
            new File([blob], `converted.${resultExt}`, {
              type: blob.type || targetFormat,
            }),
          ),
        ]);

        if (
          outputDims.width < sourceDims.width ||
          outputDims.height < sourceDims.height
        ) {
          setConversionNote(
            `Auto size-safe downscaling applied: ${sourceDims.width}x${sourceDims.height} -> ${outputDims.width}x${outputDims.height}.`,
          );
        }
      } catch {
        // Ignore note generation errors.
      }

      const ratio = blob.size / file.size;
      if (ratio > 3 && mode !== "max_quality") {
        toast.warning(
          "Converted file is much larger than original. This can happen when converting to PNG/TIFF or high-quality settings.",
        );
      }
      toast.success("Image converted successfully");
    } catch (error) {
      console.error(error);
      toast.error((error as Error).message || "Conversion failed");
    } finally {
      setIsConverting(false);
    }
  }

  function handleDownload() {
    if (!file || !result) return;
    downloadBlob(result.blob, `${getBaseName(file.name)}.${resultExt}`);
  }

  function handleReset() {
    if (result?.url) URL.revokeObjectURL(result.url);
    setResult(null);
    resetInput();
  }

  // 7) Effects
  useEffect(() => {
    let mounted = true;

    async function detect() {
      try {
        const support = await imageUtils.getEncodeSupport();
        const entries = encodableFormats.map((item) => [item.mime, support[item.mime]] as const);
        if (!mounted) return;
        setSupported(Object.fromEntries(entries));
      } catch (error) {
        console.error(error);
      }
    }

    void detect();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (result?.url) URL.revokeObjectURL(result.url);
    };
  }, [result?.url]);

  useEffect(() => {
    if (!result?.url) return;
    URL.revokeObjectURL(result.url);
    setResult(null);
    setConversionNote(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetFormat, quality, mode, file]);

  // 8) Render
  return (
    <PDFToolLayout
      showUpload={files.length === 0}
      uploadProps={{
        title: "Upload Image",
        subtitle: "Choose one image to convert",
        label: "Upload Image",
        accept: "image/*,.heic,.heif",
        fileInputRef,
        handleFileUpload,
        triggerFileInput,
      }}
      sidebarTitle="Convert Image"
      sidebarWidth="sm"
      disabled={isConverting}
      content={
        file ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Original</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={files[0].url} alt="Original" className="w-full rounded-lg border bg-muted" />
              <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Converted</p>
              {result ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={result.url} alt="Converted" className="w-full rounded-lg border bg-muted" />
              ) : (
                <div className="w-full min-h-48 rounded-lg border bg-muted flex items-center justify-center text-sm text-muted-foreground">
                  Converted preview will appear here
                </div>
              )}
              <p className="text-xs text-muted-foreground">{result ? formatBytes(result.blob.size) : "-"}</p>
              {conversionNote && (
                <p className="text-xs text-amber-600">{conversionNote}</p>
              )}
            </div>
          </div>
        ) : null
      }
      controls={
        <>
          <div className="space-y-2 mb-5">
            <Label htmlFor="target-format">Output Format</Label>
            <Select value={targetFormat} onValueChange={(v) => setTargetFormat(v as OutputImageFormat)}>
              <SelectTrigger id="target-format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {IMAGE_FORMAT_OPTIONS.map((format) => (
                  <SelectItem key={format.mime} value={format.mime}>
                    {format.label}
                    {format.mime === "image/heic" ? " (limited)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {targetFormat === "image/heic" && (
              <p className="text-xs text-amber-600">HEIC output is currently unavailable in browser canvas APIs.</p>
            )}
          </div>

          {showQuality && (
            <QualitySlider value={quality} onChange={setQuality} disabled={isConverting} />
          )}

          <div className="space-y-2 mb-4">
            <Label htmlFor="conversion-mode">Conversion Mode</Label>
            <Select
              value={mode}
              onValueChange={(value) => setMode(value as ConversionMode)}
            >
              <SelectTrigger id="conversion-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONVERSION_MODES.map((entry) => (
                  <SelectItem key={entry.value} value={entry.value}>
                    {entry.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {CONVERSION_MODES.find((entry) => entry.value === mode)?.helper}
            </p>
          </div>

          <div className="text-xs text-muted-foreground mb-4">
            Browser support: JPG {supported["image/jpeg"] ? "yes" : "no"}, PNG {supported["image/png"] ? "yes" : "no"}, WEBP {supported["image/webp"] ? "yes" : "no"}, AVIF {supported["image/avif"] ? "yes" : "no"}, TIFF {supported["image/tiff"] ? "yes" : "no"}
          </div>
          {!isLoaded && (
            <p className="text-xs text-muted-foreground mb-4">Loading image engine...</p>
          )}

          <div className="flex-1" />
        </>
      }
      actions={
        result ? (
          <Button onClick={handleDownload} className="w-full h-10 sm:h-12 text-sm sm:text-base font-semibold" aria-label="Download converted image">
            <DownloadIcon className="w-5 h-5 sm:mr-2" />
            <span className="hidden sm:inline">Download</span>
          </Button>
        ) : (
          <Button onClick={handleConvert} disabled={!canConvert} className="w-full h-10 sm:h-12 text-sm sm:text-base font-semibold">
            {isConverting ? "Converting..." : "Convert Image"}
          </Button>
        )
      }
      secondaryActions={
        <Button variant="outline" onClick={handleReset} className="w-full" aria-label="Start over">
          <RotateCcwIcon className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Convert Another</span>
        </Button>
      }
    />
  );
}
