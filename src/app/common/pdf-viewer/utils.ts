import { useState } from "react";
import JSZip from "jszip";
import { PageFromPDFFile } from "../hooks";
import { FileUploaded, PDFLibType } from "../types";
import { createPDFBlobURL, hexToRgb } from "../utils";

// Declare Comlink on window
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Comlink: any;
  }
}

export function getPageOverlayProps(pageNumber: number) {
  return {
    "data-component": "overlay",
    "data-page-number": pageNumber,
  };
}

export function getPageOverlayPropsFromEvent(
  event: React.MouseEvent<HTMLElement, MouseEvent>,
) {
  let props = null;

  const target = event.target;

  if (target instanceof HTMLElement) {
    const page = target.closest("[data-page-number]");
    const pageNumber = Number(page?.getAttribute("data-page-number"));

    if (!Number.isNaN(pageNumber)) {
      props = {
        "data-page-number": pageNumber,
      };
    }
  }

  return props;
}

export type FileWithPages = {
  file: FileUploaded;
  fileId: FileUploaded["id"];
  isProcessing: boolean;
  pages: PageFromPDFFile[];
};

export interface WatermarkConfig {
  text: string;
  fontSize: number;
  fontFamily: "Helvetica" | "Times-Roman" | "Courier";
  color: string;
  opacity: number;
  rotation: number;
  // shadow: boolean;
  // shadowDepth: number;
  // layer: "front" | "back";
}

export async function applyWatermark(
  pdfLib: PDFLibType,
  fileWithPages: FileWithPages,
  config: WatermarkConfig,
) {
  const fileData = fileWithPages.file;
  const fileObject = fileData.file;

  const pdfBytes = await fileObject.arrayBuffer();

  const pdfDoc = await pdfLib.PDFDocument.load(pdfBytes);

  const fontFamily =
    config.fontFamily === "Helvetica"
      ? pdfLib.StandardFonts.Helvetica
      : config.fontFamily === "Times-Roman"
        ? pdfLib.StandardFonts.TimesRoman
        : pdfLib.StandardFonts.Courier;

  const font = await pdfDoc.embedFont(fontFamily);
  const color = hexToRgb(config.color);
  const size = config.fontSize;

  const textWidth = font.widthOfTextAtSize(config.text, size);
  const textHeight = font.heightAtSize(size);

  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();
    const pageCenterX = width / 2;
    const pageCenterY = height / 2;

    const angleRad = (config.rotation * Math.PI) / 180;

    const dx = textWidth / 2;
    const dy = textHeight / 2;

    const offsetX = dx * Math.cos(angleRad) - dy * Math.sin(angleRad);
    const offsetY = dx * Math.sin(angleRad) + dy * Math.cos(angleRad);

    const x = pageCenterX - offsetX;
    const y = pageCenterY - offsetY;

    page.drawText(config.text, {
      x,
      y,
      font,
      size: config.fontSize,
      opacity: config.opacity,
      color: pdfLib.rgb(color.r, color.g, color.b),
      rotate: pdfLib.degrees(config.rotation),
    });
  }

  return pdfDoc.save();
}

export interface ICompressPDFOptions {
  jpegQuality?: number;
  linearize?: boolean;
  mode?: "relaxed" | "strict";
}

export async function compressPDF(
  buffer: ArrayBuffer,
  options: ICompressPDFOptions = {},
) {
  const comlinkModule = await import("comlink");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const WorkerThread: any = comlinkModule.proxy(
    new window.Worker("/js/pdfcpu/worker.js"),
  );

  const workerInstancePromise = new WorkerThread();
  const workerInstance = await workerInstancePromise;
  const bufferFile = await workerInstance.optimize(buffer, options);

  return bufferFile;
}

export async function mergePDFPages(
  pdfLib: PDFLibType,
  pages: PageFromPDFFile[],
) {
  const mergedPdf = await pdfLib.PDFDocument.create();

  for (const { file, pageIndex } of pages) {
    const buffer = await file.arrayBuffer();
    const srcPdf = await pdfLib.PDFDocument.load(buffer);

    const [copiedPage] = await mergedPdf.copyPages(srcPdf, [pageIndex]);

    mergedPdf.addPage(copiedPage);
  }

  const mergedBytes = await mergedPdf.save();
  return mergedBytes;
}

export function splitPDFFiles(pdfLib: PDFLibType, ranges: PageFromPDFFile[][]) {
  const splitPromises = ranges.map((range) => mergePDFPages(pdfLib, range));
  return Promise.all(splitPromises);
}

export async function splitPDFWithPDFCPU(
  fileBuffer: ArrayBuffer,
  ranges: PageFromPDFFile[][],
) {
  try {
    // Convert PageFromPDFFile ranges to simple page number arrays (1-indexed for pdfcpu)
    const pageRanges = ranges.map(
      (range) => range.map((page) => page.pageIndex + 1), // Convert 0-indexed to 1-indexed
    );

    // Load Comlink if not already loaded
    if (!window.Comlink) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "/js/comlinkjs/3.1.1/umd/comlink.js";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    // Create worker instance using global Comlink
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const WorkerThread: any = window.Comlink.proxy(
      new window.Worker("/js/pdfcpu/worker.js"),
    );

    const workerInstancePromise = new WorkerThread();
    const workerInstance = await workerInstancePromise;
    const splitBuffers = await workerInstance.split(fileBuffer, pageRanges);

    // Check if splitBuffers is valid
    if (!splitBuffers || !Array.isArray(splitBuffers)) {
      return [];
    }

    return splitBuffers;
  } catch (error) {
    throw error;
  }
}

export function useSplitPDFFiles() {
  const [isProcessing, setIsProcessing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [error, setError] = useState<any>(null);
  const [isSuccess, setSuccess] = useState(false);

  const splitFiles = async (
    pdfLib: PDFLibType,
    ranges: PageFromPDFFile[][],
  ) => {
    if (isProcessing) {
      alert("Processing is already in progress");
      return [];
    }

    setIsProcessing(true);
    setSuccess(false);

    try {
      let arrayBuffers: Uint8Array[] = [];

      // Try pdfcpu first, fallback to pdf-lib if it fails
      try {
        const fileBuffer = await ranges[0][0].file.arrayBuffer();
        const pdfcpuBuffers = await splitPDFWithPDFCPU(fileBuffer, ranges);

        if (pdfcpuBuffers && pdfcpuBuffers.length > 0) {
          arrayBuffers = pdfcpuBuffers;
        } else {
          throw new Error("pdfcpu returned no files");
        }
      } catch {
        // Fallback to pdf-lib based splitting
        arrayBuffers = await splitPDFFiles(pdfLib, ranges);
      }

      if (!arrayBuffers || arrayBuffers.length === 0) {
        throw new Error("No files returned from split operation");
      }

      const urls = [];
      const zip = new JSZip();

      // Add each PDF to the zip file
      for (let i = 0; i < arrayBuffers.length; i++) {
        const arrayBuffer = arrayBuffers[i];
        const pdfBlobUrl = createPDFBlobURL(arrayBuffer);
        urls.push(pdfBlobUrl);

        // Add PDF to zip with filename
        zip.file(`split-${i + 1}.pdf`, arrayBuffer);
      }

      // Generate the zip file
      const zipBlob = await zip.generateAsync({ type: "blob" });

      // Create a download link for the zip
      const zipUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = zipUrl;
      link.download = `split-pdfs-${Date.now()}.zip`;
      link.click();

      // Clean up the URL after download
      setTimeout(() => URL.revokeObjectURL(zipUrl), 100);

      setIsProcessing(false);
      setSuccess(true);
      return urls;
    } catch (err) {
      setError(err);
      setIsProcessing(false);
      return [];
    }
  };

  const resetSplitter = () => {
    setIsProcessing(false);
    setError(null);
    setSuccess(false);
  };

  return {
    isProcessing,
    isSuccess,
    error,
    resetSplitter,
    splitFiles,
  };
}
