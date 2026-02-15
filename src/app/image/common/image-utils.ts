"use client";

export type OutputImageFormat =
  | "image/png"
  | "image/jpeg"
  | "image/webp"
  | "image/avif"
  | "image/tiff"
  | "image/heic";

export type EncodableImageFormat = Exclude<OutputImageFormat, "image/heic">;

export const IMAGE_FORMAT_OPTIONS: Array<{
  mime: OutputImageFormat;
  label: string;
  ext: string;
}> = [
  { mime: "image/png", label: "PNG", ext: "png" },
  { mime: "image/jpeg", label: "JPG", ext: "jpg" },
  { mime: "image/webp", label: "WEBP", ext: "webp" },
  { mime: "image/avif", label: "AVIF", ext: "avif" },
  { mime: "image/tiff", label: "TIFF", ext: "tiff" },
  { mime: "image/heic", label: "HEIC", ext: "heic" },
];

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

export function getBaseName(filename: string): string {
  return filename.replace(/\.[^/.]+$/, "");
}

export function isLikelyHeic(file: File): boolean {
  const lower = file.name.toLowerCase();
  return file.type === "image/heic" || file.type === "image/heif" || lower.endsWith(".heic") || lower.endsWith(".heif");
}

export function fitWithinBox(
  width: number,
  height: number,
  maxWidth?: number,
  maxHeight?: number,
): { width: number; height: number } {
  if (!maxWidth && !maxHeight) {
    return { width, height };
  }

  const wLimit = maxWidth || width;
  const hLimit = maxHeight || height;
  const scale = Math.min(wLimit / width, hLimit / height, 1);

  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
