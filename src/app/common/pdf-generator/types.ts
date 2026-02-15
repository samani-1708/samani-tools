/**
 * PDF Generator Types
 * Common types and interfaces for image-to-pdf conversion
 */

export type Orientation = "portrait" | "landscape";

export type PageSize = "a4" | "natural" | "us-letter";

export type Margin = "none" | "small" | "large";

export interface ImageToPdfOptions {
  orientation: Orientation;
  pageSize: PageSize;
  margin: Margin;
}

export interface ImageInput {
  url: string;
  type: "image/png" | "image/jpeg";
}

export interface PageDimensions {
  width: number;
  height: number;
}

export interface ImagePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Page sizes in points (72 points = 1 inch)
export const PAGE_SIZES: Record<PageSize, PageDimensions> = {
  a4: { width: 595.28, height: 841.89 }, // 210 × 297 mm
  "us-letter": { width: 612, height: 792 }, // 8.5 × 11 inches (215.9 × 279.4 mm)
  natural: { width: 0, height: 0 }, // Will be determined by image size
};

// Margin sizes in points
export const MARGIN_SIZES: Record<Margin, number> = {
  none: 0,
  small: 36, // 0.5 inch
  large: 72, // 1 inch
};

/**
 * Get page dimensions based on size and orientation
 */
export function getPageDimensions(
  pageSize: PageSize,
  orientation: Orientation,
  imageWidth?: number,
  imageHeight?: number
): PageDimensions {
  if (pageSize === "natural" && imageWidth && imageHeight) {
    // For natural size, use image dimensions
    if (orientation === "landscape" && imageHeight > imageWidth) {
      return { width: imageHeight, height: imageWidth };
    }
    return { width: imageWidth, height: imageHeight };
  }

  const baseDimensions = PAGE_SIZES[pageSize];

  if (orientation === "landscape") {
    return { width: baseDimensions.height, height: baseDimensions.width };
  }

  return baseDimensions;
}

/**
 * Calculate image position and size to fit within page with margins
 */
export function calculateImageFit(
  imageWidth: number,
  imageHeight: number,
  pageDimensions: PageDimensions,
  margin: Margin
): ImagePosition {
  const marginSize = MARGIN_SIZES[margin];
  const availableWidth = pageDimensions.width - marginSize * 2;
  const availableHeight = pageDimensions.height - marginSize * 2;

  // Calculate scale to fit image within available space
  const scale = Math.min(
    availableWidth / imageWidth,
    availableHeight / imageHeight
  );

  const scaledWidth = imageWidth * scale;
  const scaledHeight = imageHeight * scale;

  // Center the image
  const x = marginSize + (availableWidth - scaledWidth) / 2;
  const y = marginSize + (availableHeight - scaledHeight) / 2;

  return { x, y, width: scaledWidth, height: scaledHeight };
}

/**
 * Abstract interface for PDF generators
 */
export interface IPdfGenerator {
  /**
   * Convert images to PDF
   * @param images Array of image inputs
   * @param options Conversion options
   * @returns PDF as Uint8Array
   */
  generatePdf(
    images: ImageInput[],
    options: ImageToPdfOptions
  ): Promise<Uint8Array>;
}

/**
 * Fetch image buffer from URL
 */
export async function fetchImageBuffer(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  return response.arrayBuffer();
}

/**
 * Create a blob URL from PDF bytes
 */
export function createPDFBlobURL(pdfBytes: Uint8Array): string {
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  return URL.createObjectURL(blob);
}
