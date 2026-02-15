export interface CompressOptions {
  mode?: "relaxed" | "strict";
}

// Crop box defined as [xMin, yMin, xMax, yMax] in points
export interface CropBox {
  x: number;      // left
  y: number;      // bottom
  width: number;  // width
  height: number; // height
}

export interface CropOptions {
  /** Pages to apply crop to. If empty, applies to all pages */
  pages?: number[];
  /** The crop box in points (PDF coordinate system) */
  cropBox: CropBox;
  /** Unit for display (internally always uses points) */
  unit?: "points" | "inches" | "mm" | "cm";
}

export type WatermarkPosition = "c" | "tl" | "tc" | "tr" | "l" | "r" | "bl" | "bc" | "br";

export interface TextWatermarkOptions {
  text: string;
  fontFamily: "Helvetica" | "Times-Roman" | "Courier";
  fontSize: number;
  color: string;
  opacity: number;
  rotation: number;
  position: WatermarkPosition;
  onTop: boolean;
  scale?: number;
}

export interface ImageWatermarkOptions {
  opacity: number;
  rotation: number;
  position: WatermarkPosition;
  onTop: boolean;
  scale?: number;
}

export interface IPdfUtilsLib {
  merge(files: Array<FileObject>): Promise<Uint8Array>;
  split(file: FileObject, ranges: number[][]): Promise<Uint8Array[]>;
  embedImages(
    images: ImageInput[],
    options: ImageToPdfOptions,
  ): Promise<Uint8Array>;

  getPageCount(file: FileObject): Promise<number>;

  compress(file: FileObject, options?: CompressOptions): Promise<Uint8Array>;

  watermarkText?(file: FileObject, options: TextWatermarkOptions): Promise<Uint8Array>;
  watermarkImage?(file: FileObject, imageBuffer: ArrayBuffer, imageName: string, options: ImageWatermarkOptions): Promise<Uint8Array>;
}

export type FileObject = { id: string; buffer: ArrayBuffer; }

export type Orientation = "portrait" | "landscape";

export type PageSize = "a4" | "natural" | "us-letter";

export type Margin = "none" | "small" | "large";

export interface ImageToPdfOptions {
  orientation: Orientation;
  pageSize: PageSize;
  margin: Margin;
}

export interface ImageInput {
  buffer: ArrayBuffer;
  type: "image/png" | "image/jpeg";
}

export interface PageDimensions {
  width: number;
  height: number;
}

export const PAGE_SIZES: Record<PageSize, PageDimensions> = {
  a4: { width: 595.28, height: 841.89 }, // 210 × 297 mm
  "us-letter": { width: 612, height: 792 }, // 8.5 × 11 inches (215.9 × 279.4 mm)
  natural: { width: 0, height: 0 }, // Will be determined by image size
};

export const MARGIN_SIZES: Record<Margin, number> = {
  none: 0,
  small: 36, // 0.5 inch
  large: 72, // 1 inch
};

export interface ImagePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Watermark positioning types
export type WatermarkPositionType =
  | "top-left" | "top-center" | "top-right"
  | "middle-left" | "center" | "middle-right"
  | "bottom-left" | "bottom-center" | "bottom-right"
  | "mosaic";

export type WatermarkLayerType = "over" | "under";
export type WatermarkFontFamily = "Helvetica" | "Times-Roman" | "Courier";

export interface TextWatermarkConfig {
  text: string;
  fontSize: number;
  fontFamily: WatermarkFontFamily;
  color: string;
}

export interface WatermarkSettings {
  type: "text" | "image";
  textConfig: TextWatermarkConfig;
  imageFile: File | null;
  position: WatermarkPositionType;
  opacity: number;
  rotation: number;
  layer: WatermarkLayerType;
  scale: number;
}

export const DEFAULT_WATERMARK_SETTINGS: WatermarkSettings = {
  type: "text",
  textConfig: {
    text: "CONFIDENTIAL",
    fontSize: 48,
    fontFamily: "Helvetica",
    color: "#888888",
  },
  imageFile: null,
  position: "center",
  opacity: 0.3,
  rotation: 0,
  layer: "over",
  scale: 0.3,
};

// Helper functions for watermark positioning
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 0.5, g: 0.5, b: 0.5 };
}

export function getPositionsToRender(position: WatermarkPositionType): Exclude<WatermarkPositionType, "mosaic">[] {
  if (position === "mosaic") {
    return [
      "top-left", "top-center", "top-right",
      "middle-left", "center", "middle-right",
      "bottom-left", "bottom-center", "bottom-right"
    ];
  }
  return [position];
}

// Rotation types
export interface RotateOptions {
  rotation: number; // 90, 180, 270, -90, -180, -270
  pages?: number[]; // 0-indexed page numbers
}

// Encryption types
export type EncryptionMode = "aes" | "rc4";
// Note: WASM pdfcpu only supports 40 and 128-bit keys (not 256)
export type EncryptionKeyLength = 40 | 128;
export type EncryptionPermissions = "none" | "print" | "all";

export interface EncryptOptions {
  ownerPassword: string;
  userPassword?: string;
  mode?: EncryptionMode;
  keyLength?: EncryptionKeyLength;
  permissions?: EncryptionPermissions;
}

export interface DecryptOptions {
  ownerPassword?: string;
  userPassword?: string;
}

// Page number types
export type PageNumberPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export interface PageNumberOptions {
  position: PageNumberPosition;
  format: string; // e.g., "{n}", "Page {n} of {p}", etc.
  startNumber?: number; // Default 1
  startPage?: number; // 0-indexed, default 0
  fontSize?: number;
  color?: string; // hex
  fontFamily?: WatermarkFontFamily;
}

export const PAGE_NUMBER_PRESETS = [
  { label: "Simple", format: "{n}" },
  { label: "Page X", format: "Page {n}" },
  { label: "Page X of Y", format: "Page {n} of {p}" },
  { label: "- X -", format: "- {n} -" },
  { label: "X / Y", format: "{n} / {p}" },
] as const;

export const DEFAULT_PAGE_NUMBER_OPTIONS: PageNumberOptions = {
  position: "bottom-right",
  format: "{n}",
  startNumber: 1,
  startPage: 0,
  fontSize: 12,
  color: "#000000",
  fontFamily: "Helvetica",
};

// Organize PDF types (for page management)
export interface OrganizePageAction {
  type: "delete" | "rotate" | "move" | "insert";
  pageIndex: number;
  payload?: {
    rotation?: number;
    newIndex?: number;
  };
}

export function calculateWatermarkPosition(
  position: Exclude<WatermarkPositionType, "mosaic">,
  pageWidth: number,
  pageHeight: number,
  contentWidth: number,
  contentHeight: number,
  rotation: number
): { x: number; y: number } {
  const padding = 40;
  const angleRad = (rotation * Math.PI) / 180;

  const cos = Math.abs(Math.cos(angleRad));
  const sin = Math.abs(Math.sin(angleRad));
  const rotatedWidth = contentWidth * cos + contentHeight * sin;
  const rotatedHeight = contentWidth * sin + contentHeight * cos;

  let centerX: number;
  let centerY: number;

  switch (position) {
    case "top-left":
      centerX = padding + rotatedWidth / 2;
      centerY = pageHeight - padding - rotatedHeight / 2;
      break;
    case "top-center":
      centerX = pageWidth / 2;
      centerY = pageHeight - padding - rotatedHeight / 2;
      break;
    case "top-right":
      centerX = pageWidth - padding - rotatedWidth / 2;
      centerY = pageHeight - padding - rotatedHeight / 2;
      break;
    case "middle-left":
      centerX = padding + rotatedWidth / 2;
      centerY = pageHeight / 2;
      break;
    case "center":
      centerX = pageWidth / 2;
      centerY = pageHeight / 2;
      break;
    case "middle-right":
      centerX = pageWidth - padding - rotatedWidth / 2;
      centerY = pageHeight / 2;
      break;
    case "bottom-left":
      centerX = padding + rotatedWidth / 2;
      centerY = padding + rotatedHeight / 2;
      break;
    case "bottom-center":
      centerX = pageWidth / 2;
      centerY = padding + rotatedHeight / 2;
      break;
    case "bottom-right":
      centerX = pageWidth - padding - rotatedWidth / 2;
      centerY = padding + rotatedHeight / 2;
      break;
    default:
      centerX = pageWidth / 2;
      centerY = pageHeight / 2;
  }

  const dx = contentWidth / 2;
  const dy = contentHeight / 2;
  const offsetX = dx * Math.cos(angleRad) - dy * Math.sin(angleRad);
  const offsetY = dx * Math.sin(angleRad) + dy * Math.cos(angleRad);

  return {
    x: centerX - offsetX,
    y: centerY - offsetY,
  };
}
