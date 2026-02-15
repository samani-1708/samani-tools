"use client";

import { useFileUpload } from "@/app/common/hooks";
import { useImageUtils } from "@/app/image/common/use-image-utils.hooks";
import { PDFToolLayout } from "@/app/pdf/common/layouts/pdf-tool-layout";
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
  DiamondMinusIcon,
  DownloadIcon,
  MinusIcon,
  PlusIcon,
  RotateCcwIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  EncodableImageFormat,
  downloadBlob,
  formatBytes,
  getBaseName,
} from "../common/image-utils";
import { QualitySlider } from "../common/quality-slider";

type Position =
  | "top-left"
  | "top-center"
  | "top-right"
  | "middle-left"
  | "center"
  | "middle-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right"
  | "mosaic";

const POSITIONS: { value: Position; label: string }[] = [
  { value: "top-left", label: "Top Left" },
  { value: "top-center", label: "Top Center" },
  { value: "top-right", label: "Top Right" },
  { value: "middle-left", label: "Middle Left" },
  { value: "center", label: "Center" },
  { value: "middle-right", label: "Middle Right" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "bottom-center", label: "Bottom Center" },
  { value: "bottom-right", label: "Bottom Right" },
  { value: "mosaic", label: "Mosaic" },
];

const POSITION_GRID: Position[] = [
  "top-left",
  "top-center",
  "top-right",
  "middle-left",
  "center",
  "middle-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];

function getAutoFontSize(width: number, height: number): number {
  const minSide = Math.min(width, height);
  const size = Math.round(minSide * 0.08);
  return Math.max(24, Math.min(220, size));
}

function getOutputFormat(mimeType: string | undefined): EncodableImageFormat {
  if (mimeType === "image/png") return "image/png";
  if (mimeType === "image/webp") return "image/webp";
  if (mimeType === "image/avif") return "image/avif";
  if (mimeType === "image/tiff") return "image/tiff";
  return "image/jpeg";
}

function getExtensionForFormat(format: EncodableImageFormat): string {
  if (format === "image/png") return "png";
  if (format === "image/webp") return "webp";
  if (format === "image/avif") return "avif";
  if (format === "image/tiff") return "tiff";
  return "jpg";
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const expanded =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => `${c}${c}`)
          .join("")
      : clean.padEnd(6, "0").slice(0, 6);
  const r = parseInt(expanded.slice(0, 2), 16);
  const g = parseInt(expanded.slice(2, 4), 16);
  const b = parseInt(expanded.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}

export function PageClient() {
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
  const [text, setText] = useState("samani.in");
  const [fontSize, setFontSize] = useState(36);
  const [opacity, setOpacity] = useState(100);
  const [color, setColor] = useState("#ffffff");
  const [position, setPosition] = useState<Position>("center");
  const [rotation, setRotation] = useState(0);
  const [quality, setQuality] = useState(80);
  const [isDownloading, setIsDownloading] = useState(false);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);

  const canvasWrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const format = useMemo(() => getOutputFormat(file?.type), [file?.type]);
  const showQuality = format !== "image/png" && format !== "image/tiff";
  const isBusy = isDownloading;

  useEffect(() => {
    if (!file) {
      setImageElement(null);
      return;
    }
    const img = new Image();
    img.onload = () => setImageElement(img);
    img.src = files[0].url;
  }, [file, files]);

  useEffect(() => {
    if (!file || !isLoaded) return;
    let ignore = false;

    (async () => {
      try {
        const dims = await imageUtils.readDimensions(file);
        if (!ignore) setFontSize(getAutoFontSize(dims.width, dims.height));
      } catch (error) {
        console.error(error);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [file, isLoaded, imageUtils]);

  useEffect(() => {
    if (!imageElement || !canvasRef.current || !canvasWrapRef.current) return;

    const draw = () => {
      const canvas = canvasRef.current;
      const wrap = canvasWrapRef.current;
      if (!canvas || !wrap) return;

      const maxWidth = Math.max(1, Math.floor(wrap.clientWidth));
      const ratio = imageElement.naturalWidth / imageElement.naturalHeight;
      const drawWidth = maxWidth;
      const drawHeight = Math.max(1, Math.round(drawWidth / ratio));
      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.max(1, Math.round(drawWidth * dpr));
      canvas.height = Math.max(1, Math.round(drawHeight * dpr));
      canvas.style.width = `${drawWidth}px`;
      canvas.style.height = `${drawHeight}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, drawWidth, drawHeight);
      ctx.drawImage(imageElement, 0, 0, drawWidth, drawHeight);

      const scale = drawWidth / imageElement.naturalWidth;
      const size = Math.max(10, fontSize * scale);
      const margin = Math.max(8, Math.round(size * 0.6));
      const textColor = hexToRgba(color, opacity / 100);
      const angle = (rotation * Math.PI) / 180;

      ctx.font = `${Math.round(size)}px sans-serif`;
      ctx.textBaseline = "top";
      ctx.fillStyle = textColor;

      const textWidth = ctx.measureText(text).width;
      const textHeight = size * 1.2;

      const drawText = (x: number, y: number) => {
        ctx.save();
        if (rotation !== 0) {
          ctx.translate(x + textWidth / 2, y + textHeight / 2);
          ctx.rotate(angle);
          ctx.fillText(text, -textWidth / 2, -textHeight / 2);
        } else {
          ctx.fillText(text, x, y);
        }
        ctx.restore();
      };

      if (position === "mosaic") {
        const tileW = drawWidth / 3;
        const tileH = drawHeight / 3;
        for (let row = 0; row < 3; row += 1) {
          for (let col = 0; col < 3; col += 1) {
            const centerX = col * tileW + tileW / 2;
            const centerY = row * tileH + tileH / 2;
            drawText(centerX - textWidth / 2, centerY - textHeight / 2);
          }
        }
        return;
      }

      let x = margin;
      let y = margin;
      if (position.includes("center")) x = (drawWidth - textWidth) / 2;
      if (position.includes("right")) x = drawWidth - textWidth - margin;
      if (position.includes("middle") || position === "center") y = (drawHeight - textHeight) / 2;
      if (position.includes("bottom")) y = drawHeight - textHeight - margin;

      drawText(x, y);
    };

    draw();
    window.addEventListener("resize", draw);
    return () => {
      window.removeEventListener("resize", draw);
    };
  }, [imageElement, text, fontSize, color, opacity, position, rotation]);

  function handleRotateBy(degrees: number) {
    setRotation((prev) => Math.max(-180, Math.min(180, prev + degrees)));
  }

  async function handleDownload() {
    if (!file || !isLoaded || !text.trim()) return;
    setIsDownloading(true);
    try {
      const blob = await imageUtils.watermarkText(file, {
        text,
        fontSize,
        opacity,
        color,
        position,
        rotation,
        format,
        quality: showQuality ? quality / 100 : undefined,
      });
      downloadBlob(
        blob,
        `${getBaseName(file.name)}-watermarked.${getExtensionForFormat(format)}`,
      );
      toast.success("Watermarked image downloaded");
    } catch (error) {
      console.error(error);
      toast.error((error as Error).message || "Failed to download watermarked image");
    } finally {
      setIsDownloading(false);
    }
  }

  function handleReset() {
    setRotation(0);
    resetInput();
  }

  return (
    <PDFToolLayout
      showUpload={files.length === 0}
      uploadProps={{
        title: "Upload Image",
        subtitle: "Choose one image to watermark",
        label: "Upload Image",
        accept: "image/*,.heic,.heif",
        fileInputRef,
        handleFileUpload,
        triggerFileInput,
      }}
      sidebarTitle="Watermark Image"
      sidebarWidth="sm"
      disabled={isBusy}
      content={
        file ? (
          <div className="max-w-3xl mx-auto w-full space-y-2">
            <div
              ref={canvasWrapRef}
              className="w-full rounded-lg border bg-muted overflow-hidden"
            >
              <canvas ref={canvasRef} className={cn("w-full h-auto block")} />
            </div>
            <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
          </div>
        ) : null
      }
      controls={
        <>
          <div className="space-y-2 mb-5">
            <Label htmlFor="wm-text">Watermark Text</Label>
            <Input
              id="wm-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter watermark text"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="space-y-2">
              <Label htmlFor="font-size">Font Size</Label>
              <Input
                id="font-size"
                type="number"
                min={10}
                max={220}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value) || 36)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10"
              />
            </div>
          </div>

          <div className="space-y-2 mb-5">
            <Label htmlFor="position">Position</Label>
            <Select value={position} onValueChange={(v) => setPosition(v as Position)}>
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

          <div className="grid grid-cols-3 gap-1 p-2 bg-gray-100 dark:bg-gray-800 rounded mb-5">
            {POSITION_GRID.map((pos) => (
              <button
                key={pos}
                type="button"
                onClick={() => setPosition(pos)}
                className={cn(
                  "aspect-square rounded text-xs transition-colors",
                  position === pos || position === "mosaic"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600",
                )}
              />
            ))}
          </div>
          
          <div className="space-y-2 mb-5">
            <Label htmlFor="opacity">Opacity: {opacity}%</Label>
            <input
              id="opacity"
              type="range"
              min={5}
              max={100}
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="space-y-2 mb-5">
            <div className="flex items-center justify-between">
              <Label htmlFor="rotation">Rotation: {rotation}°</Label>
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
                  onClick={() => setRotation(0)}
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
              value={rotation}
              onChange={(e) => setRotation(parseInt(e.target.value))}
              min="-180"
              max="180"
              step="5"
            />
          </div>

          {showQuality && (
            <QualitySlider value={quality} onChange={setQuality} disabled={isBusy} />
          )}

          {!isLoaded && (
            <p className="text-xs text-muted-foreground mb-5">Loading image engine...</p>
          )}

          <div className="flex-1" />
        </>
      }
      actions={
        <Button
          onClick={handleDownload}
          disabled={!file || isBusy || !isLoaded || !text.trim()}
          className="w-full h-10 sm:h-12 text-sm sm:text-base font-semibold"
          aria-label="Download watermarked image"
        >
          <DownloadIcon className="w-5 h-5 sm:mr-2" />
          <span className="hidden sm:inline">
            {isDownloading ? "Preparing..." : "Download"}
          </span>
        </Button>
      }
      secondaryActions={
        <Button
          variant="outline"
          onClick={handleReset}
          className="w-full"
          aria-label="Start over"
        >
          <RotateCcwIcon className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Watermark Another</span>
        </Button>
      }
    />
  );
}
