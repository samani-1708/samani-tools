/**
 * PDF-lib based PDF Generator
 * Fallback implementation using pdf-lib library
 */

import {
  calculateImageFit,
  fetchImageBuffer,
  getPageDimensions,
  ImageInput,
  ImageToPdfOptions,
  IPdfGenerator,
} from "./types";

export class PdfLibGenerator implements IPdfGenerator {
  private pdfLib: typeof import("pdf-lib") | null = null;

  /**
   * Dynamically load pdf-lib
   */
  private async loadPdfLib(): Promise<typeof import("pdf-lib")> {
    if (!this.pdfLib) {
      this.pdfLib = await import("pdf-lib");
    }
    return this.pdfLib;
  }

  /**
   * Generate PDF from images using pdf-lib
   */
  async generatePdf(
    images: ImageInput[],
    options: ImageToPdfOptions
  ): Promise<Uint8Array> {
    const pdfLib = await this.loadPdfLib();
    const pdfDoc = await pdfLib.PDFDocument.create();

    // Fetch all image buffers
    const imageBuffers = await Promise.all(
      images.map((img) => fetchImageBuffer(img.url))
    );

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const buffer = imageBuffers[i];

      // Embed image
      let embeddedImage: Awaited<
        ReturnType<typeof pdfDoc.embedPng | typeof pdfDoc.embedJpg>
      >;

      if (image.type === "image/png") {
        embeddedImage = await pdfDoc.embedPng(buffer);
      } else {
        embeddedImage = await pdfDoc.embedJpg(buffer);
      }

      const imageWidth = embeddedImage.width;
      const imageHeight = embeddedImage.height;

      // Get page dimensions
      const pageDimensions = getPageDimensions(
        options.pageSize,
        options.orientation,
        imageWidth,
        imageHeight
      );

      // For natural size, adjust page to fit image with margins
      let finalPageWidth = pageDimensions.width;
      let finalPageHeight = pageDimensions.height;

      if (options.pageSize === "natural") {
        const marginSize =
          options.margin === "none" ? 0 : options.margin === "small" ? 36 : 72;
        finalPageWidth = imageWidth + marginSize * 2;
        finalPageHeight = imageHeight + marginSize * 2;

        if (options.orientation === "landscape" && finalPageHeight > finalPageWidth) {
          [finalPageWidth, finalPageHeight] = [finalPageHeight, finalPageWidth];
        }
      }

      // Add page
      const page = pdfDoc.addPage([finalPageWidth, finalPageHeight]);

      // Calculate image position
      const position = calculateImageFit(
        imageWidth,
        imageHeight,
        { width: finalPageWidth, height: finalPageHeight },
        options.margin
      );

      // Draw image on page
      page.drawImage(embeddedImage, {
        x: position.x,
        y: position.y,
        width: position.width,
        height: position.height,
      });
    }

    return pdfDoc.save();
  }
}

// Singleton instance
let pdfLibGeneratorInstance: PdfLibGenerator | null = null;

export default function getPdfLibGenerator(): PdfLibGenerator {
  if (!pdfLibGeneratorInstance) {
    pdfLibGeneratorInstance = new PdfLibGenerator();
  }
  return pdfLibGeneratorInstance;
}
