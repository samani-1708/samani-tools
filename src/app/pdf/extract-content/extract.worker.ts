import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { OEM, createWorker } from "tesseract.js";

const pdfjsAny = pdfjsLib as any;
const getDocument = pdfjsAny.getDocument as typeof pdfjsLib.getDocument;
try {
  if (pdfjsAny?.GlobalWorkerOptions) {
    pdfjsAny.GlobalWorkerOptions.workerSrc = "/js/pdf-worker/4.8.69/pdf-worker.min.js";
  }
} catch {
  // Ignore immutable export cases.
}

type ExtractedSpan = {
  text: string;
  fontName?: string;
  fontFamily?: string;
  fontSize: number;
  color?: string;
  width?: number;
  height?: number;
  bold: boolean;
  italic: boolean;
  underline?: boolean;
  strike?: boolean;
  x: number;
  y: number;
};

type ExtractedLine = {
  text: string;
  semantic: "heading" | "paragraph";
  fontSize: number;
  bold: boolean;
  italic: boolean;
};

type ExtractedPage = {
  pageNumber: number;
  text: string;
  lines: ExtractedLine[];
  spans: ExtractedSpan[];
  source: "native" | "ocr";
  imageNames: string[];
};

type ExtractedAsset = {
  name: string;
  page: number;
  mime: string;
  buffer: ArrayBuffer;
};

type ExtractRequest = {
  type: "extract";
  fileBuffer: ArrayBuffer;
  useOcrFallback: boolean;
  ocrMode?: "speed" | "balanced" | "accuracy" | "rigorous";
};

type ExtractProgressEvent = {
  type: "progress";
  currentPage: number;
  totalPages: number;
  message: string;
  stage: "text" | "ocr" | "assets" | "finalizing";
  progress: number;
};

type ExtractLogEvent = {
  type: "log";
  message: string;
};

type ExtractDoneEvent = {
  type: "done";
  pages: ExtractedPage[];
  assets: ExtractedAsset[];
};

type ExtractErrorEvent = {
  type: "error";
  error: string;
};

type PipelineOptions = {
  mode: "speed" | "balanced" | "accuracy" | "rigorous";
  ocrScale: number;
  ocrPasses: number;
  psm: string;
  preserveInterwordSpaces: "0" | "1";
};

function median(values: number[]): number {
  if (values.length === 0) return 12;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function lineFromSpans(spans: ExtractedSpan[], baseline: number): ExtractedLine {
  const ordered = [...spans].sort((a, b) => a.x - b.x);
  const text = ordered.map((s) => s.text).join(" ").replace(/\s+/g, " ").trim();
  const maxFont = ordered.reduce((m, s) => Math.max(m, s.fontSize), 0);
  const anyBold = ordered.some((s) => s.bold);
  const anyItalic = ordered.some((s) => s.italic);
  const semantic: "heading" | "paragraph" =
    maxFont >= baseline * 1.25 || anyBold ? "heading" : "paragraph";

  return {
    text,
    semantic,
    fontSize: maxFont,
    bold: anyBold,
    italic: anyItalic,
  };
}

function postProgress(payload: Omit<ExtractProgressEvent, "type">) {
  const event: ExtractProgressEvent = { type: "progress", ...payload };
  (self as any).postMessage(event);
}

function postLog(message: string) {
  const event: ExtractLogEvent = { type: "log", message };
  (self as any).postMessage(event);
}

function isLowPowerDevice(): boolean {
  const nav = (self as any).navigator || {};
  const cores = Number(nav.hardwareConcurrency || 0);
  const mem = Number(nav.deviceMemory || 0);
  if (cores > 0 && cores <= 4) return true;
  if (mem > 0 && mem <= 4) return true;
  return false;
}

function resolvePipelineOptions(request: ExtractRequest): PipelineOptions {
  const mode = request.ocrMode || (isLowPowerDevice() ? "speed" : "balanced");

  if (mode === "speed") {
    return {
      mode,
      ocrScale: 1.25,
      ocrPasses: 1,
      psm: "6",
      preserveInterwordSpaces: "0",
    };
  }
  if (mode === "balanced") {
    return {
      mode,
      ocrScale: 1.5,
      ocrPasses: 1,
      psm: "3",
      preserveInterwordSpaces: "0",
    };
  }
  if (mode === "accuracy") {
    return {
      mode,
      ocrScale: 1.8,
      ocrPasses: 1,
      psm: "3",
      preserveInterwordSpaces: "1",
    };
  }
  return {
    mode: "rigorous",
    ocrScale: 2,
    ocrPasses: 3,
    psm: "3",
    preserveInterwordSpaces: "1",
  };
}

async function runOcrOnPage(
  page: any,
  ocrWorker: Awaited<ReturnType<typeof createWorker>>,
  ocrScale: number,
  ocrPasses: number,
) {
  const viewport = page.getViewport({ scale: ocrScale });
  const canvas = new OffscreenCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const context = canvas.getContext("2d");
  if (!context) return [] as ExtractedLine[];

  await page.render({ canvasContext: context as any, viewport }).promise;
  let bestLines: ExtractedLine[] = [];

  for (let i = 0; i < ocrPasses; i++) {
    const ocrResult = await ocrWorker.recognize(canvas as any);
    const text = (ocrResult?.data?.text || "").trim();
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => ({
        text: line,
        semantic: "paragraph" as const,
        fontSize: 12,
        bold: false,
        italic: false,
      }));

    if (lines.length > bestLines.length) bestLines = lines;
    if (bestLines.length > 20) break;
  }

  return bestLines;
}

async function extractTextAndSemantics(
  fileBuffer: ArrayBuffer,
  useOcrFallback: boolean,
  options: PipelineOptions,
) {
  const loadingTask = getDocument({
    data: new Uint8Array(fileBuffer),
    disableWorker: true,
    worker: null,
    useWorkerFetch: false,
    isEvalSupported: false,
    isOffscreenCanvasSupported: true,
  } as any);

  const doc = await loadingTask.promise;
  const pages: ExtractedPage[] = [];
  let ocrWorker: Awaited<ReturnType<typeof createWorker>> | null = null;

  if (useOcrFallback) {
    // Force LSTM-only to avoid "legacy engine requested" failures.
    ocrWorker = await createWorker("eng", OEM.LSTM_ONLY, {
      legacyCore: false,
      legacyLang: false,
      logger: (m: any) => {
        if (m?.status) postLog(`tesseract: ${m.status} ${Math.round((m.progress || 0) * 100)}%`);
      },
    } as any);
    // Tune OCR behavior for speed/accuracy preference from UI.
    await (ocrWorker as any).setParameters?.({
      tessedit_pageseg_mode: options.psm,
      preserve_interword_spaces: options.preserveInterwordSpaces,
    });
  }

  try {
    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
      postProgress({
        currentPage: pageNum,
        totalPages: doc.numPages,
        message: `Reading page ${pageNum} of ${doc.numPages}`,
        stage: "text",
        progress: Math.round((pageNum / doc.numPages) * 65),
      });

      const page = await doc.getPage(pageNum);
      let textContent: any;
      try {
        textContent = await page.getTextContent();
      } catch (error) {
        postLog(`page ${pageNum}: text layer read failed (${error instanceof Error ? error.message : String(error)})`);
        textContent = { items: [] };
      }

      const styles = textContent.styles || {};
      const spans = (textContent.items || [])
        .map((item: any) => {
          const text = String(item.str || "").trim();
          if (!text) return null;

          const fontName = String(item.fontName || "");
          const style = styles[fontName] || {};
          const fontFamily = String(style.fontFamily || "");
          const bold = /bold|black|semibold/i.test(fontName);
          const italic = /italic|oblique/i.test(fontName);
          const transform = item.transform || [1, 0, 0, 1, 0, 0];
          const fontSize = Math.hypot(transform[0], transform[1]) || 12;
          const width = Math.abs(Number(item.width || 0)) || undefined;
          const height = Math.abs(Number(item.height || 0)) || undefined;
          const color =
            typeof item.color === "string"
              ? item.color
              : typeof style.fill === "string"
                ? style.fill
                : undefined;
          const underline = /underline/i.test(fontName);
          const strike = /strike|crossedout/i.test(fontName);

          return {
            text,
            fontName,
            fontFamily,
            fontSize,
            color,
            width,
            height,
            bold,
            italic,
            underline,
            strike,
            x: Number(transform[4] || 0),
            y: Number(transform[5] || 0),
          } satisfies ExtractedSpan;
        })
        .filter(Boolean) as ExtractedSpan[];

      const baseline = median(spans.map((s) => s.fontSize));
      const rows: Record<string, ExtractedSpan[]> = {};
      const rowTolerance = 3;

      for (const span of spans) {
        const rowKey = String(Math.round(span.y / rowTolerance) * rowTolerance);
        rows[rowKey] = rows[rowKey] || [];
        rows[rowKey].push(span);
      }

      let lines = Object.keys(rows)
        .map((rowKey) => ({ y: Number(rowKey), line: lineFromSpans(rows[rowKey], baseline) }))
        .sort((a, b) => b.y - a.y)
        .map((v) => v.line)
        .filter((line) => line.text.length > 0);

      let source: "native" | "ocr" = "native";
      const nativeCharCount = lines.reduce((acc, line) => acc + line.text.length, 0);
      const shouldRunOcr =
        useOcrFallback &&
        Boolean(ocrWorker) &&
        (lines.length === 0 || nativeCharCount < 30 || spans.length < 8);

      if (shouldRunOcr && ocrWorker) {
        postProgress({
          currentPage: pageNum,
          totalPages: doc.numPages,
          message: `OCR on page ${pageNum}`,
          stage: "ocr",
          progress: Math.max(66, Math.round((pageNum / doc.numPages) * 90)),
        });

        try {
          const ocrLines = await runOcrOnPage(
            page,
            ocrWorker,
            options.ocrScale,
            options.ocrPasses,
          );
          if (ocrLines.length > 0) {
            if (lines.length === 0 || ocrLines.length >= lines.length * 1.3) {
              lines = ocrLines;
              source = "ocr";
            } else if (nativeCharCount < 30) {
              // Keep both when native text is too sparse.
              lines = [...lines, ...ocrLines];
              source = "ocr";
            }
          }
        } catch (error) {
          postLog(`page ${pageNum}: OCR skipped (${error instanceof Error ? error.message : String(error)})`);
        }
      }

      pages.push({
        pageNumber: pageNum,
        text: lines.map((line) => line.text).join("\n"),
        lines,
        spans,
        source,
        imageNames: [],
      });
    }
  } finally {
    if (ocrWorker) {
      await ocrWorker.terminate().catch(() => undefined);
    }
  }

  return pages;
}

self.onmessage = async (event: MessageEvent<ExtractRequest>) => {
  if (event.data?.type !== "extract") return;

  try {
    const { fileBuffer, useOcrFallback } = event.data;
    const options = resolvePipelineOptions(event.data);
    postLog(
      `pipeline=waterfall ocr=${useOcrFallback} mode=${options.mode} scale=${options.ocrScale} passes=${options.ocrPasses} psm=${options.psm}`,
    );

    postProgress({
      currentPage: 0,
      totalPages: 0,
      message: "Step 1/3: Extracting page text...",
      stage: "text",
      progress: 1,
    });

    const pages = await extractTextAndSemantics(
      fileBuffer.slice(0),
      useOcrFallback,
      options,
    );

    postProgress({
      currentPage: 0,
      totalPages: 0,
      message: "Step 2/3: Preparing asset links...",
      stage: "assets",
      progress: 88,
    });
    const assets: ExtractedAsset[] = [];

    const pageImageMap = new Map<number, string[]>();
    for (const asset of assets) {
      const targetPage = asset.page > 0 ? asset.page : 1;
      if (!pageImageMap.has(targetPage)) pageImageMap.set(targetPage, []);
      pageImageMap.get(targetPage)!.push(asset.name);
    }

    const normalizedPages = pages.map((page) => ({
      ...page,
      imageNames: pageImageMap.get(page.pageNumber) || [],
    }));

    postProgress({
      currentPage: normalizedPages.length,
      totalPages: normalizedPages.length,
      message: "Step 3/3: Finalizing outputs...",
      stage: "finalizing",
      progress: 98,
    });

    const doneEvent: ExtractDoneEvent = {
      type: "done",
      pages: normalizedPages,
      assets,
    };

    (self as any).postMessage(doneEvent, assets.map((a) => a.buffer));
  } catch (error) {
    const errText = error instanceof Error ? `${error.message}\n${error.stack || ""}` : String(error);
    postLog(`extract worker error: ${errText}`);
    const errEvent: ExtractErrorEvent = { type: "error", error: errText };
    (self as any).postMessage(errEvent);
  }
};
