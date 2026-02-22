"use client";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { EncodableImageFormat } from "./image-utils";

/**
 * Format context passed to QualityBlock:
 * - EncodableImageFormat  → show for lossy (JPEG/WebP/AVIF), hide for lossless (PNG/TIFF)
 * - "auto"                → show with note (output will be a lossy format)
 * - "original"            → show with note (depends on input)
 * - null                  → always hide
 */
export type QualityFormatContext = EncodableImageFormat | "auto" | "original" | null;

interface QualitySliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

function getQualityLabel(q: number): string {
  if (q === 100) return "Same quality as original — no extra loss";
  if (q >= 90) return "Near-original quality";
  if (q >= 70) return "Smaller file, slight quality loss";
  if (q >= 50) return "Much smaller file, visible quality loss";
  return "Minimum file size, significant quality loss";
}

function getQualityColor(q: number): string {
  if (q >= 90) return "text-green-600 dark:text-green-400";
  if (q >= 70) return "text-yellow-600 dark:text-yellow-400";
  return "text-orange-600 dark:text-orange-400";
}

export function QualitySlider({
  value,
  onChange,
  disabled = false,
  min = 10,
  max = 100,
  step = 1,
}: QualitySliderProps) {
  return (
    <div className="space-y-2 mb-5">
      <div className="flex items-center justify-between">
        <Label htmlFor="quality">Quality: {value}% of original</Label>
      </div>
      <input
        id="quality"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        disabled={disabled}
      />
      <p className={cn("text-xs", getQualityColor(value))}>
        {getQualityLabel(value)}
      </p>
    </div>
  );
}

interface QualityBlockProps {
  value: number;
  onChange: (value: number) => void;
  format: QualityFormatContext;
  disabled?: boolean;
}

function isLossyContext(format: QualityFormatContext): boolean | "maybe" {
  if (format === null) return false;
  if (format === "auto" || format === "original") return "maybe";
  return format === "image/jpeg" || format === "image/webp" || format === "image/avif";
}

const FORMAT_NOTE: Record<"auto" | "original", string> = {
  auto: "Applies to JPEG/WebP output",
  original: "Applies if original is not PNG/TIFF",
};

/**
 * Format-aware quality control. Renders the quality slider only when the
 * output format is lossy. Pass `format=null` to hide entirely.
 */
export function QualityBlock({ value, onChange, format, disabled = false }: QualityBlockProps) {
  const lossyCtx = isLossyContext(format);

  if (lossyCtx === false) return null;

  return (
    <div className="space-y-2 mb-5">
      <div className="flex items-center justify-between">
        <Label htmlFor="quality">Quality: {value}% of original</Label>
      </div>
      <input
        id="quality"
        type="range"
        min={10}
        max={100}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        disabled={disabled}
      />
      <p className={cn("text-xs", getQualityColor(value))}>
        {getQualityLabel(value)}
      </p>
      {lossyCtx === "maybe" && format && (format === "auto" || format === "original") && (
        <p className="text-xs text-muted-foreground">{FORMAT_NOTE[format]}</p>
      )}
    </div>
  );
}
