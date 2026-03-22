/**
 * Compresses JPEG images embedded in a PDF using wasm-vips (image.worker).
 * Spawns the image worker internally — callers need no extra hooks.
 */

import { wrap } from "comlink";
import type { ImageWorkerAPI } from "@/app/image/common/image.worker";

/**
 * @param pdfBytes   - Input PDF bytes
 * @param jpegQuality - Slider fraction 0–1 passed to wasm-vips compress
 *                      (output quality = estimated input quality × fraction)
 */
export async function compressImagesInPDF(
  pdfBytes: ArrayBuffer | Uint8Array,
  jpegQuality: number,
): Promise<Uint8Array> {
  const { PDFDocument, PDFName, PDFRawStream, PDFNumber } = await import("pdf-lib");

  let pdfDoc: Awaited<ReturnType<typeof PDFDocument.load>>;
  try {
    pdfDoc = await PDFDocument.load(pdfBytes);
  } catch {
    // Encrypted or malformed PDF — return as-is
    return pdfBytes instanceof Uint8Array ? pdfBytes : new Uint8Array(pdfBytes);
  }

  // Collect all compressible JPEG image streams up front
  const context = pdfDoc.context;
  // Use a structural type to avoid InstanceType issues with private constructors
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type RawStream = { dict: any; contents: Uint8Array };
  type ImageEntry = { obj: RawStream; originalSize: number };
  const imageEntries: ImageEntry[] = [];

  for (const [, obj] of context.enumerateIndirectObjects()) {
    if (!(obj instanceof PDFRawStream)) continue;

    const subtype = obj.dict.get(PDFName.of("Subtype"));
    if (subtype?.toString() !== "/Image") continue;

    // Only single DCTDecode (JPEG) streams
    const filterEntry = obj.dict.get(PDFName.of("Filter"));
    if (!filterEntry || filterEntry.toString() !== "/DCTDecode") continue;

    // Skip tiny images (masks, icons)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = (obj.dict.get(PDFName.of("Width")) as any)?.asNumber?.() as number | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const h = (obj.dict.get(PDFName.of("Height")) as any)?.asNumber?.() as number | undefined;
    if (!w || !h || w < 32 || h < 32) continue;

    imageEntries.push({ obj, originalSize: obj.contents.byteLength });
  }

  if (imageEntries.length === 0) {
    return pdfBytes instanceof Uint8Array ? pdfBytes : new Uint8Array(pdfBytes);
  }

  // Spawn the image worker once for all images
  const worker = new Worker(
    new URL("@/app/image/common/image.worker.ts", import.meta.url),
    { type: "module" },
  );
  const imageApi = wrap<ImageWorkerAPI>(worker);

  let replacedCount = 0;
  try {
    for (const { obj, originalSize } of imageEntries) {
      try {
        const originalContents = obj.contents;
        const inputBuffer = originalContents.buffer.slice(
          originalContents.byteOffset,
          originalContents.byteOffset + originalContents.byteLength,
        ) as ArrayBuffer;

        const result = await imageApi.compress(
          { name: "img.jpg", type: "image/jpeg", buffer: inputBuffer },
          { quality: jpegQuality, format: "image/jpeg" },
        );

        const compressedBytes = new Uint8Array(result.buffer);
        if (compressedBytes.byteLength < originalSize) {
          obj.contents = compressedBytes;
          obj.dict.set(PDFName.of("Length"), PDFNumber.of(compressedBytes.byteLength));
          replacedCount++;
        }
      } catch {
        // Skip this image if compression fails
      }
    }
  } finally {
    worker.terminate();
  }

  if (replacedCount === 0) {
    return pdfBytes instanceof Uint8Array ? pdfBytes : new Uint8Array(pdfBytes);
  }

  return pdfDoc.save();
}
