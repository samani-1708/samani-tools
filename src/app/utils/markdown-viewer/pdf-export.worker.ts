/// <reference lib="webworker" />
import { PDFDocument, rgb } from "pdf-lib";

type ExportRequest = {
  type: "EXPORT_PDF";
  pages: ArrayBuffer[];
  backgroundHex: string;
};

type ExportResponse =
  | { type: "EXPORT_SUCCESS"; pdfBuffer: ArrayBuffer }
  | { type: "EXPORT_ERROR"; message: string };

const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;

function hexToRgbNormalized(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) {
    return { r: 1, g: 1, b: 1 };
  }
  const r = Number.parseInt(normalized.slice(0, 2), 16) / 255;
  const g = Number.parseInt(normalized.slice(2, 4), 16) / 255;
  const b = Number.parseInt(normalized.slice(4, 6), 16) / 255;
  return { r, g, b };
}

const workerScope = self as unknown as DedicatedWorkerGlobalScope;

workerScope.onmessage = async (event: MessageEvent<ExportRequest>) => {
  const data = event.data;
  if (!data || data.type !== "EXPORT_PDF") return;

  try {
    const pdfDoc = await PDFDocument.create();
    const { r, g, b } = hexToRgbNormalized(data.backgroundHex);

    for (const pageBuffer of data.pages) {
      const embedded = await pdfDoc.embedPng(pageBuffer);
      const page = pdfDoc.addPage([A4_WIDTH_PT, A4_HEIGHT_PT]);

      page.drawRectangle({
        x: 0,
        y: 0,
        width: A4_WIDTH_PT,
        height: A4_HEIGHT_PT,
        color: rgb(r, g, b),
      });

      const drawWidth = A4_WIDTH_PT;
      const drawHeight = (embedded.height * drawWidth) / embedded.width;
      const drawY = Math.max(0, A4_HEIGHT_PT - drawHeight);

      page.drawImage(embedded, {
        x: 0,
        y: drawY,
        width: drawWidth,
        height: drawHeight,
      });
    }

    const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
    const response: ExportResponse = {
      type: "EXPORT_SUCCESS",
      pdfBuffer: pdfBytes.buffer as ArrayBuffer,
    };
    workerScope.postMessage(response, [response.pdfBuffer]);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate PDF in worker";
    const response: ExportResponse = { type: "EXPORT_ERROR", message };
    workerScope.postMessage(response);
  }
};
