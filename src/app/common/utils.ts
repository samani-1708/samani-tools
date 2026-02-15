"use client"

import { PageSizes, PDFDocument, PDFImage } from "pdf-lib";
import { type PixelCrop } from "react-image-crop";
import { PageFromPDFFile, PDFLibType } from "./hooks";


export function moveItemInArray<T>(list: T[], from: number, to: number): T[] {
  const length = list.length;

  // Clamp indices within array bounds
  const fromIndex = Math.max(0, Math.min(from, length - 1));
  const toIndex = Math.max(0, Math.min(to, length - 1));

  if (fromIndex === toIndex) return list;

  const newList = [...list];
  const [movedItem] = newList.splice(fromIndex, 1);
  newList.splice(toIndex, 0, movedItem);

  return newList;
}

export async function getCroppedImage(
  image: HTMLImageElement,
  format: string,
  crop: PixelCrop,
  scaleDpr = true
): Promise<Blob | null> {
  if (!crop.width || !crop.height) return null;

  const pixelRatio = scaleDpr ? window.devicePixelRatio : 1;

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  const canvas = document.createElement("canvas");
  canvas.width = crop.width * pixelRatio;
  canvas.height = crop.height * pixelRatio;
  canvas.style.width = `${crop.width}px`;
  canvas.style.height = `${crop.height}px`;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), format, 0.95);
  });
}

const A4_WIDTH = PageSizes.A4[0]; // 595.28 pt
const A4_HEIGHT = PageSizes.A4[1]; // 841.89 pt

// 1. Create a new empty PDF
export async function createPdf(): Promise<PDFDocument> {
  return PDFDocument.create();
}

export function fitImageToA4(
  imgW: number,
  imgH: number
): {
  width: number;
  height: number;
  x: number;
  y: number;
} {
  const scale = Math.min(A4_WIDTH / imgW, A4_HEIGHT / imgH);
  const width = imgW * scale;
  const height = imgH * scale;
  const x = (A4_WIDTH - width) / 2;
  const y = (A4_HEIGHT - height) / 2;
  return { width, height, x, y };
}

export type AllowedImageMimeEmbedPDFType = "image/jpeg" | "image/png";

interface AllowedImageFilePDFembed extends File {
  type: AllowedImageMimeEmbedPDFType;
}

function isAllowedImageFile(file: File): file is AllowedImageFilePDFembed {
  return file.type === "image/jpeg" || file.type === "image/png";
}

export function filterPdfEmbedableImages(files: FileList | File[]) {
  return Array.from(files).filter(isAllowedImageFile);
}

type ImageObject =
  | { url: string; type: "image/png" | "image/jpeg" }
  | { file: File; type: "image/png" | "image/jpeg" };

export async function generatePdfPreviewUrl(
  images: ImageObject[]
): Promise<string> {
  const imagesBufferResolved: ArrayBuffer[] = await Promise.all(
    images.map((image) =>
      "file" in image
        ? image.file.arrayBuffer()
        : getImageBufferObjectURL(image.url)
    )
  );

  const pdfDoc = await createPdf();

  for (let i = 0; i < images.length; i++) {
    const page = pdfDoc.addPage(PageSizes.A4);
    const buffer = imagesBufferResolved[i];
    const image = images[i];

    let embeddedImage: PDFImage;

    if (image.type === "image/png") {
      embeddedImage = await pdfDoc.embedPng(buffer);
    } else {
      embeddedImage = await pdfDoc.embedJpg(buffer);
    }

    const { width, height, x, y } = fitEmbeddedImageToA4(embeddedImage);

    page.drawImage(embeddedImage, {
      x,
      y,
      width,
      height,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return createPDFBlobURL(pdfBytes);
}

export function fitEmbeddedImageToA4(image: PDFImage): {
  width: number;
  height: number;
  x: number;
  y: number;
} {
  const imgWidth = image.width;
  const imgHeight = image.height;

  const scale = Math.min(A4_WIDTH / imgWidth, A4_HEIGHT / imgHeight);

  const { width, height } = image.scale(scale);

  const x = (A4_WIDTH - width) / 2;
  const y = (A4_HEIGHT - height) / 2;

  return { width, height, x, y };
}

export async function getImageBufferObjectURL(
  url: string
): Promise<ArrayBuffer> {
  const res = await fetch(url);
  return await res.arrayBuffer();
}

type EmbeddedImage = {
  image: PDFImage;
  width: number;
  height: number;
};

export async function wrapImagesToA4Page(
  pdfDoc: PDFDocument,
  embeddedImages: EmbeddedImage[]
) {
  const PAGE_PADDING = 32;
  const IMAGE_GAP = 16;
  let page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);

  let yCursor = A4_HEIGHT - PAGE_PADDING; // Start from top
  const usableWidth = A4_WIDTH - 2 * PAGE_PADDING;
  // const usableHeight = A4_HEIGHT - 2 * PAGE_PADDING;

  for (const { image, width: imgW, height: imgH } of embeddedImages) {
    // Fit image width-wise
    const scale = Math.min(1, usableWidth / imgW);
    const scaledWidth = imgW * scale;
    const scaledHeight = imgH * scale;

    // Check if it fits vertically
    if (yCursor - scaledHeight < PAGE_PADDING) {
      // Not enough room: add new page
      page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
      yCursor = A4_HEIGHT - PAGE_PADDING;
    }

    // Draw image
    page.drawImage(image, {
      x: PAGE_PADDING + (usableWidth - scaledWidth) / 2,
      y: yCursor - scaledHeight,
      width: scaledWidth,
      height: scaledHeight,
    });

    yCursor -= scaledHeight + IMAGE_GAP; // Move down
  }
}

export function getDeciveViewport(deviceType: "mobile" | "tablet" | "desktop") {
  if (deviceType === "mobile") return "sm";
  if (deviceType === "tablet") return "md";
  return "lg";
}

export async function mergePDFPages(
  pdfLib: PDFLibType,
  pages: PageFromPDFFile[]
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

export function downloadLink(url: string, filename?: string): void {
  const link = document.createElement('a');
  link.target = '_blank';
  link.href = url;
  if (filename) {
    link.download = filename;
  }
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


export function createPDFBlobURL(pdfBytes: Uint8Array): string {
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  return URL.createObjectURL(blob);
}

export function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 0.5, g: 0.5, b: 0.5 };
}





export const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
