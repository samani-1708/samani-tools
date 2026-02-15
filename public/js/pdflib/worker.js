/**
 * PDF-Lib Web Worker
 * Handles PDF operations off the main thread using pdf-lib
 */

// Import dependencies at the top
importScripts("/js/comlinkjs/3.1.1/umd/comlink.js");
importScripts("/js/pdf-lib/1.17.1/pdf-lib.min.js");

// PDF-Lib is now available globally
const PDFLib = self.PDFLib;

class PDFLibWorker {
  constructor() {
    console.log("PDF-Lib Worker instance created");
  }

  /**
   * Get the page count of a PDF
   * @param {ArrayBuffer} buffer
   * @returns {Promise<number>}
   */
  async getPageCount(buffer) {
    const pdfDoc = await PDFLib.PDFDocument.load(buffer, {
      ignoreEncryption: true,
    });
    return pdfDoc.getPageCount();
  }

  /**
   * Merge multiple PDFs into one
   * @param {Array<{id: string, buffer: ArrayBuffer}>} files
   * @returns {Promise<Uint8Array>}
   */
  async merge(files) {
    const mergedPdf = await PDFLib.PDFDocument.create();

    for (const file of files) {
      const pdf = await PDFLib.PDFDocument.load(file.buffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      for (const page of copiedPages) {
        mergedPdf.addPage(page);
      }
    }

    return mergedPdf.save();
  }

  /**
   * Split a PDF into multiple PDFs based on page ranges
   * @param {ArrayBuffer} buffer
   * @param {Array<number[]>} ranges - Array of page indices (0-based)
   * @returns {Promise<Uint8Array[]>}
   */
  async split(buffer, ranges) {
    const pdf = await PDFLib.PDFDocument.load(buffer);

    const results = await Promise.all(
      ranges.map(async (pageIndices) => {
        const newPdf = await PDFLib.PDFDocument.create();
        const copiedPages = await newPdf.copyPages(pdf, pageIndices);
        for (const page of copiedPages) {
          newPdf.addPage(page);
        }
        return newPdf.save();
      })
    );

    return results;
  }

  /**
   * Compress a PDF
   * @param {ArrayBuffer} buffer
   * @returns {Promise<Uint8Array>}
   */
  async compress(buffer) {
    const pdfDoc = await PDFLib.PDFDocument.load(buffer);
    return pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
    });
  }

  /**
   * Embed images into a PDF
   * @param {Array<{buffer: ArrayBuffer, type: string}>} images
   * @param {{orientation: string, pageSize: string, margin: string}} options
   * @returns {Promise<Uint8Array>}
   */
  async embedImages(images, options) {

    const PAGE_SIZES = {
      a4: { width: 595.28, height: 841.89 },
      "us-letter": { width: 612, height: 792 },
      natural: { width: 0, height: 0 },
    };

    const MARGIN_SIZES = {
      none: 0,
      small: 36,
      large: 72,
    };

    const pdfDoc = await PDFLib.PDFDocument.create();

    for (const img of images) {
      let embeddedImage;
      if (img.type === "image/png") {
        embeddedImage = await pdfDoc.embedPng(img.buffer);
      } else if (img.type === "image/jpeg") {
        embeddedImage = await pdfDoc.embedJpg(img.buffer);
      }

      if (embeddedImage) {
        const pageDims = this._getPageDimensions(
          options.pageSize,
          options.orientation,
          embeddedImage.width,
          embeddedImage.height,
          PAGE_SIZES
        );

        const page = pdfDoc.addPage([pageDims.width, pageDims.height]);

        const isLandscapeReq = options.orientation === "landscape";
        const isImagePortrait = embeddedImage.height > embeddedImage.width;
        const shouldRotate = isLandscapeReq && isImagePortrait;

        const position = this._calculateImageFit(
          shouldRotate ? embeddedImage.height : embeddedImage.width,
          shouldRotate ? embeddedImage.width : embeddedImage.height,
          pageDims,
          options.margin,
          MARGIN_SIZES
        );

        page.drawImage(embeddedImage, {
          x: shouldRotate ? position.x + position.width : position.x,
          y: position.y,
          width: position.width,
          height: position.height,
          rotate: shouldRotate ? PDFLib.degrees(90) : PDFLib.degrees(0),
        });
      }
    }

    return pdfDoc.save();
  }

  /**
   * Apply text watermark to PDF
   * @param {ArrayBuffer} buffer
   * @param {Object} settings - Watermark settings
   * @returns {Promise<Uint8Array>}
   */
  async applyTextWatermark(buffer, settings) {

    const pdfDoc = await PDFLib.PDFDocument.load(buffer);

    let fontEnum = PDFLib.StandardFonts.Helvetica;
    if (settings.textConfig.fontFamily === "Times-Roman") {
      fontEnum = PDFLib.StandardFonts.TimesRoman;
    } else if (settings.textConfig.fontFamily === "Courier") {
      fontEnum = PDFLib.StandardFonts.Courier;
    }

    const font = await pdfDoc.embedFont(fontEnum);
    const color = this._hexToRgb(settings.textConfig.color);
    const fontSize = settings.textConfig.fontSize;
    const text = settings.textConfig.text;

    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const textHeight = font.heightAtSize(fontSize);

    const pages = pdfDoc.getPages();
    const positions = this._getPositionsToRender(settings.position);

    for (const page of pages) {
      const { width, height } = page.getSize();

      for (const pos of positions) {
        const { x, y } = this._calculateWatermarkPosition(
          pos,
          width,
          height,
          textWidth,
          textHeight,
          settings.rotation
        );

        page.drawText(text, {
          x,
          y,
          font,
          size: fontSize,
          opacity: settings.opacity,
          color: PDFLib.rgb(color.r, color.g, color.b),
          rotate: PDFLib.degrees(settings.rotation),
        });
      }
    }

    return pdfDoc.save();
  }

  /**
   * Apply image watermark to PDF
   * @param {ArrayBuffer} pdfBuffer
   * @param {ArrayBuffer} imageBuffer
   * @param {string} imageType - MIME type
   * @param {Object} settings - Watermark settings
   * @returns {Promise<Uint8Array>}
   */
  async applyImageWatermark(pdfBuffer, imageBuffer, imageType, settings) {

    const pdfDoc = await PDFLib.PDFDocument.load(pdfBuffer);

    let image;
    if (imageType === "image/png") {
      image = await pdfDoc.embedPng(imageBuffer);
    } else if (imageType === "image/jpeg" || imageType === "image/jpg") {
      image = await pdfDoc.embedJpg(imageBuffer);
    } else {
      throw new Error("Unsupported image format. Use PNG or JPEG.");
    }

    const scaledWidth = image.width * settings.scale;
    const scaledHeight = image.height * settings.scale;

    const pages = pdfDoc.getPages();
    const positions = this._getPositionsToRender(settings.position);

    for (const page of pages) {
      const { width, height } = page.getSize();

      for (const pos of positions) {
        const { x, y } = this._calculateWatermarkPosition(
          pos,
          width,
          height,
          scaledWidth,
          scaledHeight,
          settings.rotation
        );

        page.drawImage(image, {
          x,
          y,
          width: scaledWidth,
          height: scaledHeight,
          opacity: settings.opacity,
          rotate: PDFLib.degrees(settings.rotation),
        });
      }
    }

    return pdfDoc.save();
  }

  /**
   * Crop PDF pages by setting the CropBox
   * @param {ArrayBuffer} buffer - The PDF file buffer
   * @param {Object} options - Crop options
   * @param {number[]} options.pages - Pages to crop (0-indexed), empty for all
   * @param {Object} options.cropBox - Crop box {x, y, width, height} in points
   * @returns {Promise<Uint8Array>}
   */
  async crop(buffer, options) {
    const pdfDoc = await PDFLib.PDFDocument.load(buffer);
    const pages = pdfDoc.getPages();

    const { x, y, width, height } = options.cropBox;

    // Determine which pages to crop
    const pagesToCrop = options.pages && options.pages.length > 0
      ? options.pages
      : pages.map((_, i) => i);

    for (const pageIndex of pagesToCrop) {
      if (pageIndex >= 0 && pageIndex < pages.length) {
        const page = pages[pageIndex];
        // Set the CropBox - pdf-lib uses setCropBox method
        page.setCropBox(x, y, width, height);
      }
    }

    return pdfDoc.save();
  }

  /**
   * Get page dimensions for all pages
   * @param {ArrayBuffer} buffer
   * @returns {Promise<Array<{width: number, height: number, cropBox?: object}>>}
   */
  async getPageDimensions(buffer) {
    const pdfDoc = await PDFLib.PDFDocument.load(buffer, { ignoreEncryption: true });
    const pages = pdfDoc.getPages();

    return pages.map(page => {
      const { width, height } = page.getSize();
      const mediaBox = page.getMediaBox();
      const cropBox = page.getCropBox();

      return {
        width,
        height,
        mediaBox: {
          x: mediaBox.x,
          y: mediaBox.y,
          width: mediaBox.width,
          height: mediaBox.height,
        },
        cropBox: cropBox ? {
          x: cropBox.x,
          y: cropBox.y,
          width: cropBox.width,
          height: cropBox.height,
        } : null,
      };
    });
  }

  /**
   * Rotate PDF pages
   * @param {ArrayBuffer} buffer
   * @param {Object} options - Rotation options
   * @param {number} options.rotation - Rotation degrees (90, 180, 270, -90, -180, -270)
   * @param {number[]} options.pages - Pages to rotate (0-indexed), empty for all
   * @returns {Promise<Uint8Array>}
   */
  async rotate(buffer, options) {
    const pdfDoc = await PDFLib.PDFDocument.load(buffer);
    const pages = pdfDoc.getPages();

    const pagesToRotate = options.pages && options.pages.length > 0
      ? options.pages
      : pages.map((_, i) => i);

    for (const pageIndex of pagesToRotate) {
      if (pageIndex >= 0 && pageIndex < pages.length) {
        const page = pages[pageIndex];
        const currentRotation = page.getRotation().angle;
        const newRotation = (currentRotation + options.rotation) % 360;
        page.setRotation(PDFLib.degrees(newRotation));
      }
    }

    return pdfDoc.save();
  }

  /**
   * Add page numbers to PDF
   * @param {ArrayBuffer} buffer
   * @param {Object} options - Page number options
   * @param {string} options.position - Position (top-left, top-right, bottom-left, bottom-right)
   * @param {string} options.format - Format string with {n} for number, {p} for total
   * @param {number} options.startNumber - Starting number (default 1)
   * @param {number} options.startPage - Page index to start from (0-indexed)
   * @param {number} options.fontSize - Font size
   * @param {string} options.color - Color in hex
   * @param {string} options.fontFamily - Font family
   * @returns {Promise<Uint8Array>}
   */
  async addPageNumbers(buffer, options) {
    const pdfDoc = await PDFLib.PDFDocument.load(buffer);
    const pages = pdfDoc.getPages();
    const totalPagesToNumber = pages.length - (options.startPage || 0);

    let fontEnum = PDFLib.StandardFonts.Helvetica;
    if (options.fontFamily === "Times-Roman") {
      fontEnum = PDFLib.StandardFonts.TimesRoman;
    } else if (options.fontFamily === "Courier") {
      fontEnum = PDFLib.StandardFonts.Courier;
    }

    const font = await pdfDoc.embedFont(fontEnum);
    const color = this._hexToRgb(options.color || "#000000");
    const fontSize = options.fontSize || 12;
    const startNumber = options.startNumber || 1;
    const startPage = options.startPage || 0;
    const format = options.format || "{n}";
    const padding = 40;

    for (let i = startPage; i < pages.length; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();
      const pageNumber = startNumber + (i - startPage);

      // Replace placeholders
      const text = format
        .replace(/\{n\}/g, pageNumber.toString())
        .replace(/\{p\}/g, totalPagesToNumber.toString());

      const textWidth = font.widthOfTextAtSize(text, fontSize);

      let x, y;
      switch (options.position) {
        case "top-left":
          x = padding;
          y = height - padding;
          break;
        case "top-right":
          x = width - padding - textWidth;
          y = height - padding;
          break;
        case "bottom-left":
          x = padding;
          y = padding;
          break;
        case "bottom-right":
        default:
          x = width - padding - textWidth;
          y = padding;
          break;
      }

      page.drawText(text, {
        x,
        y,
        font,
        size: fontSize,
        color: PDFLib.rgb(color.r, color.g, color.b),
      });
    }

    return pdfDoc.save();
  }

  /**
   * Delete pages from PDF
   * @param {ArrayBuffer} buffer
   * @param {number[]} pageIndices - Pages to delete (0-indexed)
   * @returns {Promise<Uint8Array>}
   */
  async deletePages(buffer, pageIndices) {
    const pdfDoc = await PDFLib.PDFDocument.load(buffer);

    // Sort indices in descending order to delete from end first
    const sortedIndices = [...pageIndices].sort((a, b) => b - a);

    for (const index of sortedIndices) {
      if (index >= 0 && index < pdfDoc.getPageCount()) {
        pdfDoc.removePage(index);
      }
    }

    return pdfDoc.save();
  }

  /**
   * Reorder pages in PDF
   * @param {ArrayBuffer} buffer
   * @param {number[]} newOrder - Array where index is new position and value is old page index
   * @returns {Promise<Uint8Array>}
   */
  async reorderPages(buffer, newOrder) {
    const sourcePdf = await PDFLib.PDFDocument.load(buffer);
    const newPdf = await PDFLib.PDFDocument.create();

    for (const oldIndex of newOrder) {
      const [copiedPage] = await newPdf.copyPages(sourcePdf, [oldIndex]);
      newPdf.addPage(copiedPage);
    }

    return newPdf.save();
  }

  /**
   * Insert a blank page
   * @param {ArrayBuffer} buffer
   * @param {number} atIndex - Where to insert (0-indexed)
   * @param {Object} pageSize - {width, height} in points
   * @returns {Promise<Uint8Array>}
   */
  async insertBlankPage(buffer, atIndex, pageSize) {
    const pdfDoc = await PDFLib.PDFDocument.load(buffer);
    const width = pageSize?.width || 612;
    const height = pageSize?.height || 792;

    pdfDoc.insertPage(atIndex, [width, height]);

    return pdfDoc.save();
  }

  // Helper methods
  _hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16) / 255,
          g: parseInt(result[2], 16) / 255,
          b: parseInt(result[3], 16) / 255,
        }
      : { r: 0.5, g: 0.5, b: 0.5 };
  }

  _getPositionsToRender(position) {
    if (position === "mosaic") {
      return [
        "top-left", "top-center", "top-right",
        "middle-left", "center", "middle-right",
        "bottom-left", "bottom-center", "bottom-right"
      ];
    }
    return [position];
  }

  _calculateWatermarkPosition(position, pageWidth, pageHeight, contentWidth, contentHeight, rotation) {
    const padding = 40;
    const angleRad = (rotation * Math.PI) / 180;

    const cos = Math.abs(Math.cos(angleRad));
    const sin = Math.abs(Math.sin(angleRad));
    const rotatedWidth = contentWidth * cos + contentHeight * sin;
    const rotatedHeight = contentWidth * sin + contentHeight * cos;

    let centerX, centerY;

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

  _getPageDimensions(pageSize, orientation, imageWidth, imageHeight, PAGE_SIZES) {
    let width, height;

    if (pageSize === "natural" && imageWidth && imageHeight) {
      width = imageWidth;
      height = imageHeight;
    } else {
      const base = PAGE_SIZES[pageSize] || PAGE_SIZES.a4;
      width = base.width;
      height = base.height;
    }

    const isLandscape = orientation === "landscape";
    const isCurrentlyPortrait = height > width;
    const isCurrentlyLandscape = width > height;

    if (isLandscape && isCurrentlyPortrait) {
      return { width: height, height: width };
    } else if (!isLandscape && isCurrentlyLandscape) {
      return { width: height, height: width };
    }

    return { width, height };
  }

  _calculateImageFit(imageWidth, imageHeight, pageDimensions, margin, MARGIN_SIZES) {
    const marginSize = MARGIN_SIZES[margin] || 0;
    const availableWidth = pageDimensions.width - marginSize * 2;
    const availableHeight = pageDimensions.height - marginSize * 2;

    const scale = Math.min(
      availableWidth / imageWidth,
      availableHeight / imageHeight
    );

    const scaledWidth = imageWidth * scale;
    const scaledHeight = imageHeight * scale;

    const x = marginSize + (availableWidth - scaledWidth) / 2;
    const y = marginSize + (availableHeight - scaledHeight) / 2;

    return { x, y, width: scaledWidth, height: scaledHeight };
  }
}

// Expose the worker class via Comlink
Comlink.expose(PDFLibWorker, self);
console.log("PDF-Lib Worker initialized");
