"use client";

import { useFileUpload } from "@/app/common/hooks";
import { useImageUtils } from "@/app/image/common/use-image-utils.hooks";
import { PDFToolLayout } from "@/app/pdf/common/layouts/pdf-tool-layout";
import { ProcessingButton } from "@/app/pdf/common/layouts/processing-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DownloadIcon, RotateCcwIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  EncodableImageFormat,
  downloadBlob,
  getBaseName,
} from "../common/image-utils";
import { QualitySlider } from "../common/quality-slider";

const MAX_DIMENSION = 16384;
const PERCENTAGE_PRESETS = [25, 50, 75, 100, 150, 200];

function clampDim(value: number): number {
  return Math.max(1, Math.min(MAX_DIMENSION, Math.round(value)));
}

export function PageClient() {
  const accept = "image/*,.heic,.heif";

  const [isProcessing, setIsProcessing] = useState(false);
  const [keepAspectRatio, setKeepAspectRatio] = useState(true);
  const [originalWidth, setOriginalWidth] = useState(0);
  const [originalHeight, setOriginalHeight] = useState(0);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [mode, setMode] = useState<"dimensions" | "percentage">("dimensions");
  const [percentage, setPercentage] = useState(100);
  const [quality, setQuality] = useState(80);
  const [result, setResult] = useState<{ blob: Blob; url: string; format: EncodableImageFormat } | null>(null);

  const [isLoaded, imageUtils] = useImageUtils();
  const { files, fileInputRef, handleFileUpload, triggerFileInput, resetInput } =
    useFileUpload((f) =>
      Array.from(f).filter((file) => {
        if (file.type.startsWith("image/")) return true;
        const lower = file.name.toLowerCase();
        return lower.endsWith(".heic") || lower.endsWith(".heif");
      }),
    );

  const file = files[0]?.file;
  const isPng = file?.type === "image/png";
  const canResize = Boolean(file) && width > 0 && height > 0 && isLoaded && !isProcessing;

  function onWidthChange(nextWidth: number) {
    const safe = clampDim(nextWidth || 1);
    setWidth(safe);
    if (originalWidth > 0) {
      setPercentage(Math.max(1, Math.round((safe / originalWidth) * 100)));
    }
    if (keepAspectRatio && originalWidth && originalHeight) {
      setHeight(clampDim((safe / originalWidth) * originalHeight));
    }
  }

  function onHeightChange(nextHeight: number) {
    const safe = clampDim(nextHeight || 1);
    setHeight(safe);
    if (originalHeight > 0) {
      setPercentage(Math.max(1, Math.round((safe / originalHeight) * 100)));
    }
    if (keepAspectRatio && originalWidth && originalHeight) {
      setWidth(clampDim((safe / originalHeight) * originalWidth));
    }
  }

  function onPercentageChange(nextPercentage: number) {
    const safe = Math.max(1, nextPercentage || 1);
    setPercentage(safe);
    if (!originalWidth || !originalHeight) return;
    setWidth(clampDim((originalWidth * safe) / 100));
    setHeight(clampDim((originalHeight * safe) / 100));
  }

  async function handleResize() {
    if (!file || isProcessing || width < 1 || height < 1) return;

    const w = clampDim(width);
    const h = clampDim(height);

    setIsProcessing(true);
    if (result?.url) URL.revokeObjectURL(result.url);
    setResult(null);

    try {
      const format: EncodableImageFormat = isPng ? "image/png" : "image/jpeg";
      const blob = await imageUtils.resize(file, {
        width: w,
        height: h,
        format,
        quality: isPng ? undefined : quality / 100,
      });
      const url = URL.createObjectURL(blob);
      setResult({ blob, url, format });
      toast.success("Image resized successfully");
    } catch (error) {
      console.error(error);
      toast.error((error as Error).message || "Resize failed");
    } finally {
      setIsProcessing(false);
    }
  }

  function handleDownload() {
    if (!file || !result) return;
    const ext = result.format === "image/png" ? "png" : "jpg";
    downloadBlob(result.blob, `${getBaseName(file.name)}-${width}x${height}.${ext}`);
  }

  function handleReset() {
    if (result?.url) URL.revokeObjectURL(result.url);
    setResult(null);
    setOriginalWidth(0);
    setOriginalHeight(0);
    setWidth(0);
    setHeight(0);
    setMode("dimensions");
    setPercentage(100);
    setQuality(80);
    setKeepAspectRatio(true);
    resetInput();
  }

  useEffect(() => {
    async function loadDimensions() {
      if (!file) return;
      try {
        const dims = await imageUtils.readDimensions(file);
        setOriginalWidth(dims.width);
        setOriginalHeight(dims.height);
        setWidth(dims.width);
        setHeight(dims.height);
        setPercentage(100);
      } catch (error) {
        console.error(error);
        toast.error("Could not read image dimensions");
      }
    }

    void loadDimensions();
  }, [file, imageUtils]);

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
  }, [width, height, percentage, mode, keepAspectRatio, quality, file]);

  return (
    <PDFToolLayout
      showUpload={files.length === 0}
      uploadProps={{
        title: "Upload Image",
        subtitle: "Choose one image to resize",
        label: "Upload Image",
        accept,
        fileInputRef,
        handleFileUpload,
        triggerFileInput,
      }}
      sidebarTitle="Resize Image"
      sidebarWidth="sm"
      disabled={isProcessing}
      content={
        file ? (
          <div className="flex flex-wrap gap-6 justify-center items-start">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Uploaded Image</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={files[0].url} alt="Uploaded" className="max-w-full max-h-[420px] rounded-lg border bg-muted" />
              <p className="text-sm text-muted-foreground truncate">{file.name}</p>
              <p className="text-sm text-muted-foreground">Original: {originalWidth} x {originalHeight}</p>
            </div>
            {result && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Resized Preview</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={result.url} alt="Resized" className="max-w-full max-h-[420px] rounded-lg border bg-muted" />
              </div>
            )}
          </div>
        ) : null
      }
      controls={
        <>
          <Tabs value={mode} onValueChange={(value) => setMode(value as "dimensions" | "percentage")} className="mb-5">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="dimensions">By Height/Width</TabsTrigger>
              <TabsTrigger value="percentage">By Percentage</TabsTrigger>
            </TabsList>
            <TabsContent value="dimensions" className="pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="width">Width</Label>
                  <Input id="width" type="number" min={1} max={MAX_DIMENSION} value={width || ""} onChange={(e) => onWidthChange(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Height</Label>
                  <Input id="height" type="number" min={1} max={MAX_DIMENSION} value={height || ""} onChange={(e) => onHeightChange(Number(e.target.value))} />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="percentage" className="pt-4">
              <div className="flex flex-wrap gap-2 mb-3">
                {PERCENTAGE_PRESETS.map((p) => (
                  <Button
                    key={p}
                    variant={percentage === p ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPercentageChange(p)}
                  >
                    {p}%
                  </Button>
                ))}
              </div>
              <div className="space-y-2">
                <Label htmlFor="percentage">Custom: {percentage}%</Label>
                <Input
                  id="percentage"
                  type="number"
                  min={1}
                  max={500}
                  value={percentage || ""}
                  onChange={(e) => onPercentageChange(Number(e.target.value))}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex items-center gap-3 mb-5">
            <Switch id="aspect-ratio" checked={keepAspectRatio} onCheckedChange={setKeepAspectRatio} />
            <Label htmlFor="aspect-ratio">Lock aspect ratio</Label>
          </div>

          {!isPng && (
            <QualitySlider value={quality} onChange={setQuality} disabled={isProcessing} />
          )}

          {!isLoaded && (
            <p className="text-xs text-muted-foreground mb-6">Loading image engine...</p>
          )}

          <div className="flex-1" />
        </>
      }
      actions={
        result ? (
          <Button onClick={handleDownload} className="w-full h-10 sm:h-12 text-sm sm:text-base font-semibold" aria-label="Download resized image">
            <DownloadIcon className="w-5 h-5 sm:mr-2" />
            <span className="hidden sm:inline">Download</span>
          </Button>
        ) : (
          <ProcessingButton
            onClick={handleResize}
            disabled={!canResize}
            isProcessing={isProcessing}
            label="Resize Image"
            processingLabel="Resizing..."
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
