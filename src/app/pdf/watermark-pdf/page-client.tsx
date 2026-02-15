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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { DiamondMinusIcon, DownloadIcon, ImageIcon, Loader2Icon, MinusIcon, PlusIcon, RotateCcwIcon, TypeIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { usePDFUtils } from "@/app/pdf/common/use-pdf-utils.hooks";
import {
  WatermarkSettings,
  WatermarkPositionType,
  WatermarkFontFamily,
  TextWatermarkConfig,
  DEFAULT_WATERMARK_SETTINGS,
} from "@/app/pdf/common/types";
import { PDFToolLayout } from "../common/layouts/pdf-tool-layout";
import { ProcessingButton } from "../common/layouts/processing-button";

const ViewPDF = dynamic(() => import("@/app/common/pdf-viewer/pdf-viewer"), {
  ssr: false,
  loading: () => <PDFStatePending header="Loading" subHeader="" />,
});

const FONT_FAMILIES: { value: WatermarkFontFamily; label: string }[] = [
  { value: "Helvetica", label: "Helvetica" },
  { value: "Times-Roman", label: "Times Roman" },
  { value: "Courier", label: "Courier" },
];

const POSITIONS: { value: WatermarkPositionType; label: string }[] = [
  { value: "top-left", label: "Top Left" },
  { value: "top-center", label: "Top Center" },
  { value: "top-right", label: "Top Right" },
  { value: "middle-left", label: "Middle Left" },
  { value: "center", label: "Center" },
  { value: "middle-right", label: "Middle Right" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "bottom-center", label: "Bottom Center" },
  { value: "bottom-right", label: "Bottom Right" },
  { value: "mosaic", label: "Mosaic (All)" },
];

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

  const [isProcessing, setIsProcessing] = useState(false);
  const [settings, setSettings] = useState<WatermarkSettings>(DEFAULT_WATERMARK_SETTINGS);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; filename: string } | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);

  const fileUploaded: FileUploaded | null = files?.[0] || null;

  const updateSettings = useCallback((partial: Partial<WatermarkSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  const updateTextConfig = useCallback((partial: Partial<TextWatermarkConfig>) => {
    setSettings((prev) => ({
      ...prev,
      textConfig: { ...prev.textConfig, ...partial },
    }));
  }, []);

  const handleRotateBy = (degrees: number) => {
    updateSettings({
      rotation: Math.max(-180, Math.min(180, settings.rotation + degrees)),
    });
  };

  // Generate preview with debounce
  useEffect(() => {
    if (!fileUploaded || !isLoaded) return;
    if (settings.type === "image" && !settings.imageFile) return;
    if (settings.type === "text" && !settings.textConfig.text.trim()) return;

    let ignore = false;
    const timeout = setTimeout(async () => {

      console.log("here")
      try {
        const buffer = await fileUploaded.file.arrayBuffer();

        let bytes: Uint8Array;
        if (settings.type === "text") {
          bytes = await pdfUtils.applyTextWatermark(buffer, settings);
        } else {
          bytes = await pdfUtils.applyImageWatermark(buffer, settings);
        }

        if (!ignore) {
          const newUrl = createPDFBlobURL(bytes);

          setPreviewUrl((prev) => {
            if (prev) {
              URL.revokeObjectURL(prev);
            }
            return newUrl;
          });
        }
      } catch (error) {
        console.error("Preview error:", error);
      }
    }, 400);

    return () => {
      ignore = true;
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileUploaded, isLoaded, settings]);

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
  }, [fileUploaded?.id, settings]);

  const handleApplyWatermark = async () => {
    if (!fileUploaded || !isLoaded) return;
    if (settings.type === "image" && !settings.imageFile) {
      toast.error("Please select an image for the watermark");
      return;
    }

    setIsProcessing(true);

    try {
      const buffer = await fileUploaded.file.arrayBuffer();

      let bytes: Uint8Array;
      if (settings.type === "text") {
        bytes = await pdfUtils.applyTextWatermark(buffer, settings);
      } else {
        bytes = await pdfUtils.applyImageWatermark(buffer, settings);
      }

      const url = createPDFBlobURL(bytes);
      const originalName = fileUploaded.name.replace(/\.pdf$/i, "");
      setResult({ url, filename: `${originalName}-watermarked.pdf` });

      toast.success("Watermark applied successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to apply watermark");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      updateSettings({ imageFile: file });
    }
  };

  const handleReset = () => {
    if (result?.url) URL.revokeObjectURL(result.url);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setResult(null);
    setPreviewUrl(null);
    setSettings(DEFAULT_WATERMARK_SETTINGS);
    resetInput();
  };

  const handleDownload = () => {
    if (!result) return;
    downloadLink(result.url, result.filename);
  };

  const canApply = fileUploaded && isLoaded && !isProcessing &&
    (settings.type === "text" ? settings.textConfig.text.trim() : settings.imageFile);

  return (
    <PDFToolLayout
      showUpload={files.length === 0}
      uploadProps={{
        title: "Upload PDF File",
        subtitle: "Click to select a PDF to add watermark",
        label: "Upload PDF",
        fileInputRef,
        handleFileUpload,
        triggerFileInput,
      }}
      sidebarTitle="Watermark PDF"
      disabled={isProcessing}
      content={
        <div className="flex flex-wrap gap-6 justify-center items-start">
          {/* Fixed width container for preview */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 w-full max-w-[18rem] flex-shrink-0">
           
            <div className="w-full aspect-[3/4] bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
              {previewUrl ? (
                <ViewPDF
                  src={previewUrl}
                  range={[0]}
                  width={256}
                  forceRefresh
                  defaultOverrides={{
                    pageBetweenMargin: "0px",
                    pageBoxShadow: "none",
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2Icon className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
            {/* Truncated filename with max-width */}
            <p
              className="text-sm text-center text-gray-700 dark:text-gray-300 mt-3 truncate max-w-full"
              title={fileUploaded?.name}
            >
              {fileUploaded?.name}
            </p>
          </div>
        </div>
      }
      controls={
        <>
          {/* Watermark Type Tabs */}
          <Tabs
            value={settings.type}
            onValueChange={(v) => updateSettings({ type: v as "text" | "image" })}
            className="mb-6"
          >
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="text" className="flex items-center gap-2">
                <TypeIcon className="w-4 h-4" />
                Text
              </TabsTrigger>
              <TabsTrigger value="image" className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Image
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="space-y-4 mt-4">
              {/* Text Input */}
              <div className="space-y-2">
                <Label htmlFor="watermark-text">Watermark Text</Label>
                <Input
                  id="watermark-text"
                  type="text"
                  value={settings.textConfig.text}
                  onChange={(e) => updateTextConfig({ text: e.target.value })}
                  placeholder="Enter watermark text"
                />
              </div>

              {/* Font Settings Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="font-size">Font Size</Label>
                  <Input
                    id="font-size"
                    type="number"
                    value={settings.textConfig.fontSize}
                    onChange={(e) => updateTextConfig({ fontSize: Number(e.target.value) || 48 })}
                    min="10"
                    max="200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="font-family">Font</Label>
                  <Select
                    value={settings.textConfig.fontFamily}
                    onValueChange={(v) => updateTextConfig({ fontFamily: v as WatermarkFontFamily })}
                  >
                    <SelectTrigger id="font-family">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_FAMILIES.map((font) => (
                        <SelectItem key={font.value} value={font.value}>
                          {font.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Color */}
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={settings.textConfig.color}
                    onChange={(e) => updateTextConfig({ color: e.target.value })}
                    className="w-14 h-10 p-1"
                  />
                  <Input
                    type="text"
                    value={settings.textConfig.color}
                    onChange={(e) => updateTextConfig({ color: e.target.value })}
                    placeholder="#888888"
                    className="flex-1"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="image" className="space-y-4 mt-4">
              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Watermark Image</Label>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full justify-start"
                >
                  <span className="truncate">
                    {settings.imageFile ? settings.imageFile.name : "Select Image (PNG/JPEG)"}
                  </span>
                </Button>
              </div>

              {/* Image Scale */}
              <div className="space-y-2">
                <Label htmlFor="scale">Scale: {Math.round(settings.scale * 100)}%</Label>
                <Input
                  id="scale"
                  type="range"
                  value={settings.scale}
                  onChange={(e) => updateSettings({ scale: parseFloat(e.target.value) })}
                  min="0.1"
                  max="2"
                  step="0.1"
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Common Settings */}
          <div className="space-y-4 border-t pt-4">
            {/* Position */}
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Select
                value={settings.position}
                onValueChange={(v) => updateSettings({ position: v as WatermarkPositionType })}
              >
                <SelectTrigger id="position">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POSITIONS.map((pos) => (
                    <SelectItem key={pos.value} value={pos.value}>
                      {pos.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Position Grid Preview */}
            <div className="grid grid-cols-3 gap-1 p-2 bg-gray-100 dark:bg-gray-800 rounded">
              {(["top-left", "top-center", "top-right", "middle-left", "center", "middle-right", "bottom-left", "bottom-center", "bottom-right"] as const).map((pos) => (
                <button
                  key={pos}
                  onClick={() => updateSettings({ position: pos })}
                  className={cn(
                    "aspect-square rounded text-xs transition-colors",
                    settings.position === pos || settings.position === "mosaic"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                  )}
                />
              ))}
            </div>

            {/* Opacity */}
            <div className="space-y-2">
              <Label htmlFor="opacity">Opacity: {Math.round(settings.opacity * 100)}%</Label>
              <Input
                id="opacity"
                type="range"
                value={settings.opacity}
                onChange={(e) => updateSettings({ opacity: parseFloat(e.target.value) })}
                min="0.05"
                max="1"
                step="0.05"
              />
            </div>

            {/* Rotation with quick buttons */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="rotation">Rotation: {settings.rotation}°</Label>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleRotateBy(-45)}
                    title="Rotate -45°"
                  >
                    <MinusIcon className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => updateSettings({ rotation: 0 })}
                    title="Reset rotation"
                  >
                    <DiamondMinusIcon className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleRotateBy(45)}
                    title="Rotate +45°"
                  >
                    <PlusIcon className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <Input
                id="rotation"
                type="range"
                value={settings.rotation}
                onChange={(e) => updateSettings({ rotation: parseInt(e.target.value) })}
                min="-180"
                max="180"
                step="5"
              />
            </div>

            {/* Layer info */}
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                Watermark is applied on top of PDF content on all pages.
              </p>
            </div>
          </div>

          <div className="flex-1" />

          {!isLoaded && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Loading PDF tools...
            </p>
          )}
        </>
      }
      actions={
        result ? (
          <Button onClick={handleDownload} className="w-full h-10 sm:h-12 text-sm sm:text-base font-semibold" aria-label="Download watermarked PDF">
            <DownloadIcon className="w-5 h-5 sm:mr-2" />
            <span className="hidden sm:inline">Download</span>
          </Button>
        ) : (
          <ProcessingButton
            onClick={handleApplyWatermark}
            disabled={!canApply}
            isProcessing={isProcessing}
            label="Apply Watermark"
            processingLabel="Applying..."
          />
        )
      }
      secondaryActions={
        <Button
          variant="outline"
          onClick={handleReset}
          className="w-full"
          aria-label="Start over"
        >
          <RotateCcwIcon className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Start Over</span>
        </Button>
      }
    />
  );
}
