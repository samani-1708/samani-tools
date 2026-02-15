/**
 * Image to PDF Converter
 * Main facade that abstracts away the underlying PDF library
 * Uses pdfcpu as primary (when available), falls back to pdf-lib
 */

import getPdfLibGenerator from "./pdf-lib-generator";
import getPdfcpuGenerator from "./pdfcpu-generator";
import {
  createPDFBlobURL,
  ImageInput,
  ImageToPdfOptions,
  IPdfGenerator,
} from "./types";

export type {
  ImageInput,
  ImageToPdfOptions,
  Orientation,
  PageSize,
  Margin,
} from "./types";

/**
 * Image to PDF Converter class
 * Provides a unified interface for converting images to PDF
 */
export class ImageToPdfConverter {
  private primaryGenerator: IPdfGenerator;
  private fallbackGenerator: IPdfGenerator;

  constructor(options: {
    primaryGenerator: IPdfGenerator;
    fallbackGenerator: IPdfGenerator;
  }) {
    // pdf-lib as primary (stable), pdfcpu as fallback (when implemented)
    this.primaryGenerator = options.primaryGenerator;
    this.fallbackGenerator = options.fallbackGenerator;
  }

  /**
   * Convert images to PDF
   * @param images Array of image inputs (url and type)
   * @param options Conversion options (orientation, pageSize, margin)
   * @returns PDF as Uint8Array
   */
  async convert(
    images: ImageInput[],
    options: ImageToPdfOptions,
  ): Promise<Uint8Array> {
    if (images.length === 0) {
      throw new Error("No images provided");
    }

    // Try primary generator first
    try {
      return await this.primaryGenerator.generatePdf(images, options);
    } catch {
      // Fall back to secondary generator
      return await this.fallbackGenerator.generatePdf(images, options);
    }
  }

  /**
   * Convert images to PDF and return as blob URL
   * @param images Array of image inputs
   * @param options Conversion options
   * @returns Blob URL for the generated PDF
   */
  async convertToUrl(
    images: ImageInput[],
    options: ImageToPdfOptions,
  ): Promise<string> {
    const pdfBytes = await this.convert(images, options);
    return createPDFBlobURL(pdfBytes);
  }

  /**
   * Convert images to PDF and trigger download
   * @param images Array of image inputs
   * @param options Conversion options
   * @param filename Optional filename (defaults to "converted.pdf")
   */
  async convertAndDownload(
    images: ImageInput[],
    options: ImageToPdfOptions,
    filename = "converted.pdf",
  ): Promise<void> {
    const url = await this.convertToUrl(images, options);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up blob URL after a short delay
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }
}

// Singleton instance
let converterInstance: ImageToPdfConverter | null = null;

/**
 * Get the singleton ImageToPdfConverter instance
 */
export function getImageToPdfConverter(): ImageToPdfConverter {
  if (!converterInstance) {
    converterInstance = new ImageToPdfConverter({
      primaryGenerator: getPdfLibGenerator(),
      fallbackGenerator: getPdfcpuGenerator(),
    });
  }
  return converterInstance;
}

/**
 * Convenience function to convert images to PDF URL
 * @param images Array of image inputs
 * @param options Conversion options
 * @returns Blob URL for the generated PDF
 */
export async function imagesToPdfUrl(
  images: ImageInput[],
  options: ImageToPdfOptions,
): Promise<string> {
  const converter = getImageToPdfConverter();
  return converter.convertToUrl(images, options);
}

/**
 * Convenience function to convert images to PDF and download
 * @param images Array of image inputs
 * @param options Conversion options
 * @param filename Optional filename
 */
export function imagesToPdfDownload(
  images: ImageInput[],
  options: ImageToPdfOptions,
  filename?: string,
): Promise<void> {
  const converter = getImageToPdfConverter();
  return converter.convertAndDownload(images, options, filename);
}
