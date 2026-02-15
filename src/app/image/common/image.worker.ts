import { expose, transfer } from "comlink";

type EncodableImageFormat = "image/png" | "image/jpeg" | "image/webp" | "image/avif" | "image/tiff";
type ImageWatermarkPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "middle-left"
  | "center"
  | "middle-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right"
  | "mosaic";

interface WorkerImageInput {
  name: string;
  type: string;
  buffer: ArrayBuffer;
}

interface ConvertImageOptions {
  format: EncodableImageFormat;
  quality?: number;
  sizeSafe?: boolean;
  maxSizeMultiplier?: number;
}

interface CompressImageOptions {
  quality: number;
  maxWidth?: number;
  maxHeight?: number;
  format: EncodableImageFormat;
}

interface ResizeImageOptions {
  width: number;
  height: number;
  format: EncodableImageFormat;
  quality?: number;
}

interface CropImageOptions {
  area: { x: number; y: number; width: number; height: number };
  format: EncodableImageFormat;
  quality?: number;
  rotation?: number;
  flip?: "horizontal" | "vertical" | "both" | "none";
}

interface WatermarkTextOptions {
  text: string;
  fontSize: number;
  opacity: number;
  color: string;
  position: ImageWatermarkPosition;
  rotation?: number;
  format: EncodableImageFormat;
  quality?: number;
}

interface WorkerBatchJob<TOptions> {
  id: string;
  file: WorkerImageInput;
  options: TOptions;
}

type WorkerBatchResult =
  | { id: string; status: "success"; buffer: ArrayBuffer; mime: string }
  | { id: string; status: "error"; error: string };

// ---------------------------------------------------------------------------
// Runtime capability detection
// ---------------------------------------------------------------------------

const HAS_SAB = typeof SharedArrayBuffer !== "undefined";

const HAS_SIMD = (() => {
  try {
    // Minimal WASM module that uses a v128 SIMD instruction.
    // If the browser can compile it, SIMD is available.
    return WebAssembly.validate(
      new Uint8Array([
        0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0,
        10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11,
      ]),
    );
  } catch {
    return false;
  }
})();

console.log(
  `[image-worker] capabilities: SharedArrayBuffer=${HAS_SAB}, SIMD=${HAS_SIMD}`,
);

// ---------------------------------------------------------------------------
// Absolute base URL for wasm-vips assets served from public/.
// Workers spawned by Turbopack have blob: origins so bare paths fail.
// ---------------------------------------------------------------------------

const VIPS_BASE = (() => {
  try {
    const loc = self.location;
    if (loc.origin && loc.origin !== "null") return `${loc.origin}/js/wasm-vips/`;
    const m = loc.href.match(/^blob:(https?:\/\/[^/]+)/);
    if (m) return `${m[1]}/js/wasm-vips/`;
  } catch { /* ignore */ }
  return "/js/wasm-vips/";
})();

// ---------------------------------------------------------------------------
// Lazy vips initialization — only loads WASM when first operation is called
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let vipsInstance: any = null;
let heifLoaded = false;
let vipsScriptText: string | null = null;

async function loadVipsFactory(): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!vipsScriptText) {
    const resp = await fetch(`${VIPS_BASE}vips-es6.js`);
    if (!resp.ok) throw new Error(`Failed to fetch vips-es6.js: ${resp.status}`);
    vipsScriptText = await resp.text();
  }
  const blob = new Blob([vipsScriptText], { type: "application/javascript" });
  const blobUrl = URL.createObjectURL(blob);
  const mod = await import(/* webpackIgnore: true */ blobUrl);
  URL.revokeObjectURL(blobUrl);
  return mod.default;
}

async function initVips(withHeif: boolean) {
  const t0 = performance.now();
  const Vips = await loadVipsFactory();

  vipsInstance = await Vips({
    mainScriptUrlOrBlob: `${VIPS_BASE}vips-es6.js`,
    locateFile: (fileName: string) => `${VIPS_BASE}${fileName}`,
    dynamicLibraries: withHeif ? ["vips-heif.wasm"] : [],
  });

  heifLoaded = withHeif;
  console.log(
    `[image-worker] vips init (heif=${withHeif}): ${(performance.now() - t0).toFixed(0)}ms`,
  );
}

async function getVips(needsAvif = false) {
  if (needsAvif && !heifLoaded) {
    vipsInstance = null;
    await initVips(true);
  }
  if (!vipsInstance) {
    await initVips(false);
  }
  return vipsInstance;
}

function needsHeifLib(format: EncodableImageFormat): boolean {
  return format === "image/avif";
}

function inputMightBeAvif(input: WorkerImageInput): boolean {
  return input.type === "image/avif" || input.name.toLowerCase().endsWith(".avif");
}

function inputMightBeHeic(input: WorkerImageInput): boolean {
  const lower = input.name.toLowerCase();
  return input.type === "image/heic" || input.type === "image/heif" || lower.endsWith(".heic") || lower.endsWith(".heif");
}

function needsHeif(input: WorkerImageInput, format: EncodableImageFormat): boolean {
  return needsHeifLib(format) || inputMightBeAvif(input) || inputMightBeHeic(input);
}

// ---------------------------------------------------------------------------
// OffscreenCanvas — fast browser-native decode for readDimensions.
// Avoids loading the full vips WASM just to read width/height.
// ---------------------------------------------------------------------------

async function readDimensionsViaBitmap(
  buffer: ArrayBuffer,
  type: string,
): Promise<{ width: number; height: number } | null> {
  try {
    const blob = new Blob([buffer], { type: type || "application/octet-stream" });
    const bmp = await createImageBitmap(blob);
    const result = { width: bmp.width, height: bmp.height };
    bmp.close();
    return result;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Encoding helpers
// ---------------------------------------------------------------------------

function mimeToSuffix(format: EncodableImageFormat): string {
  switch (format) {
    case "image/jpeg": return ".jpg";
    case "image/webp": return ".webp";
    case "image/avif": return ".avif";
    case "image/tiff": return ".tiff";
    case "image/png":
    default: return ".png";
  }
}

function qualityToVipsOpts(format: EncodableImageFormat, quality?: number): Record<string, unknown> {
  const q = quality == null ? null : quality <= 1 ? Math.round(quality * 100) : Math.round(quality);
  switch (format) {
    case "image/jpeg": return q == null ? {} : { Q: q };
    case "image/webp": return q == null ? {} : { Q: q };
    case "image/avif": return q == null ? {} : { Q: q };
    case "image/png":
      return {
        compression: 6,
        palette: false,
        Q: q == null ? 82 : q,
      };
    case "image/tiff":
      return {
        compression: "lzw",
      };
    default: return {};
  }
}

function defaultQualityForFormat(format: EncodableImageFormat): number | undefined {
  switch (format) {
    case "image/jpeg": return 0.86;
    case "image/webp": return 0.84;
    case "image/avif": return 0.7;
    case "image/png":
    case "image/tiff":
    default:
      return undefined;
  }
}

function isLossyFormat(format: EncodableImageFormat): boolean {
  return format === "image/jpeg" || format === "image/webp" || format === "image/avif";
}

function isLossyMime(mime: string): boolean {
  return mime === "image/jpeg" || mime === "image/webp" || mime === "image/avif";
}

function isCanvasFriendlyInputMime(mime: string): boolean {
  return mime === "image/jpeg" || mime === "image/png" || mime === "image/webp" || mime === "image/avif";
}

async function encodeViaCanvas(
  file: WorkerImageInput,
  targetMime: "image/png" | "image/jpeg" | "image/webp" | "image/avif",
  quality?: number,
  maxPixels?: number,
): Promise<{ buffer: ArrayBuffer; mime: string } | null> {
  if (!isCanvasFriendlyInputMime(file.type || "")) return null;
  try {
    const blob = new Blob([file.buffer], { type: file.type || "application/octet-stream" });
    const bmp = await createImageBitmap(blob);
    let width = bmp.width;
    let height = bmp.height;
    if (maxPixels && width * height > maxPixels) {
      const scale = Math.sqrt(maxPixels / (width * height));
      width = Math.max(1, Math.round(width * scale));
      height = Math.max(1, Math.round(height * scale));
    }
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bmp.close();
      return null;
    }
    ctx.drawImage(bmp, 0, 0, width, height);
    bmp.close();
    const outBlob = await canvas.convertToBlob({
      type: targetMime,
      quality: quality == null ? undefined : Math.max(0.1, Math.min(1, quality)),
    });
    const outBuffer = await outBlob.arrayBuffer();
    return { buffer: outBuffer, mime: targetMime };
  } catch {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function writeImage(img: any, format: EncodableImageFormat, quality?: number): { buffer: ArrayBuffer; mime: string } {
  const suffix = mimeToSuffix(format);
  const opts = qualityToVipsOpts(format, quality);
  const data = img.writeToBuffer(suffix, opts);
  const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
  return { buffer, mime: format };
}

function fitWithinBox(
  width: number,
  height: number,
  maxWidth?: number,
  maxHeight?: number,
): { width: number; height: number } {
  if (!maxWidth && !maxHeight) return { width, height };
  const wLimit = maxWidth || width;
  const hLimit = maxHeight || height;
  const scale = Math.min(wLimit / width, hLimit / height, 1);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const num = parseInt(h, 16);
  if (h.length === 3) {
    return [((num >> 8) & 0xf) * 17, ((num >> 4) & 0xf) * 17, (num & 0xf) * 17];
  }
  return [(num >> 16) & 0xff, (num >> 8) & 0xff, num & 0xff];
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Some inputs are mislabeled by browsers/upload pipelines.
// Retry once with HEIF-enabled vips when generic decode fails.
async function loadInputImageWithRetry(file: WorkerImageInput) {
  let vips = await getVips(needsHeif(file, "image/jpeg"));
  try {
    return { vips, image: vips.Image.newFromBuffer(file.buffer) };
  } catch {
    vipsInstance = null;
    await initVips(true);
    vips = await getVips(true);
    return { vips, image: vips.Image.newFromBuffer(file.buffer) };
  }
}

async function renderTextOverlayBuffer(options: WatermarkTextOptions): Promise<Uint8Array> {
  const [r, g, b] = hexToRgb(options.color);
  const alpha = Math.max(0, Math.min(1, options.opacity / 100));
  const margin = Math.max(12, Math.round(options.fontSize * 0.6));

  const probe = new OffscreenCanvas(1, 1);
  const probeCtx = probe.getContext("2d");
  if (!probeCtx) throw new Error("Unable to initialize text renderer");
  probeCtx.font = `${options.fontSize}px sans-serif`;
  const metrics = probeCtx.measureText(options.text);
  const textWidth = Math.ceil(metrics.width || (options.text.length * options.fontSize * 0.65));
  const textHeight = Math.ceil(options.fontSize * 1.3);

  const width = Math.max(1, textWidth + margin * 2);
  const height = Math.max(1, textHeight + margin);
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Unable to initialize text renderer");

  ctx.clearRect(0, 0, width, height);
  ctx.font = `${options.fontSize}px sans-serif`;
  ctx.textBaseline = "top";
  ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
  ctx.fillText(options.text, margin, Math.round(margin / 2));

  const blob = await canvas.convertToBlob({ type: "image/png" });
  return new Uint8Array(await blob.arrayBuffer());
}

// ---------------------------------------------------------------------------
// Public API (exposed via Comlink)
// ---------------------------------------------------------------------------

const api = {
  async warmup(): Promise<void> {
    // No-op — vips loads lazily on first real operation.
    // The script text is prefetched so the first operation is faster.
    fetch(`${VIPS_BASE}vips-es6.js`).then(async (r) => {
      if (r.ok) vipsScriptText = await r.text();
    }).catch(() => {});
  },

  async getEncodeSupport(): Promise<Record<EncodableImageFormat, boolean>> {
    return {
      "image/png": true,
      "image/jpeg": true,
      "image/webp": true,
      "image/avif": true,
      "image/tiff": true,
    };
  },

  async readDimensions(file: WorkerImageInput): Promise<{ width: number; height: number }> {
    // Fast path: use browser-native createImageBitmap (no WASM needed)
    const fast = await readDimensionsViaBitmap(file.buffer, file.type);
    if (fast) return fast;

    // Fallback for exotic formats: use vips
    const vips = await getVips(inputMightBeAvif(file) || inputMightBeHeic(file));
    const img = vips.Image.newFromBuffer(file.buffer);
    const result = { width: img.width, height: img.height };
    img.delete();
    return result;
  },

  async convert(file: WorkerImageInput, options: ConvertImageOptions): Promise<{ buffer: ArrayBuffer; mime: string }> {
    const sizeSafe = options.sizeSafe ?? true;
    const maxSizeMultiplier = options.maxSizeMultiplier ?? 1.75;
    const targetThreshold = Math.round(file.buffer.byteLength * maxSizeMultiplier);
    const selectedQuality = options.quality ?? defaultQualityForFormat(options.format);

    // Fast path for common browser-decodable inputs to PNG.
    // This is significantly faster than vips for large JPG->PNG conversions in browser workers.
    if (options.format === "image/png") {
      const fastPng = await encodeViaCanvas(file, "image/png", undefined, sizeSafe ? 16_000_000 : undefined);
      if (fastPng) {
        if (sizeSafe && fastPng.buffer.byteLength > targetThreshold) {
          const tighter = await encodeViaCanvas(file, "image/png", undefined, 10_000_000);
          if (tighter) return transfer(tighter, [tighter.buffer]);
        }
        return transfer(fastPng, [fastPng.buffer]);
      }
    }

    // AVIF via canvas is more stable than wasm encoder on some devices/browsers.
    if (options.format === "image/avif") {
      const fastAvif = await encodeViaCanvas(
        file,
        "image/avif",
        selectedQuality ?? 0.62,
        sizeSafe ? 8_000_000 : undefined,
      );
      if (fastAvif) {
        if (!sizeSafe || fastAvif.buffer.byteLength <= targetThreshold) {
          return transfer(fastAvif, [fastAvif.buffer]);
        }
        const tighter = await encodeViaCanvas(file, "image/avif", 0.5, 6_000_000);
        if (tighter) return transfer(tighter, [tighter.buffer]);
      }
    }

    const vips = await getVips(needsHeif(file, options.format));
    let img = vips.Image.newFromBuffer(file.buffer);

    if (
      sizeSafe &&
      options.format === "image/png" &&
      isLossyMime(file.type || "")
    ) {
      const pixels = img.width * img.height;
      const maxPixels = 14_000_000;
      if (pixels > maxPixels) {
        const scale = Math.sqrt(maxPixels / pixels);
        const resized = img.resize(scale, { kernel: "lanczos3" });
        img.delete();
        img = resized;
      }
    }

    if (sizeSafe && options.format === "image/avif") {
      const pixels = img.width * img.height;
      const maxPixels = 8_000_000;
      if (pixels > maxPixels) {
        const scale = Math.sqrt(maxPixels / pixels);
        const resized = img.resize(scale, { kernel: "lanczos3" });
        img.delete();
        img = resized;
      }
    }

    if (sizeSafe && options.format === "image/tiff") {
      const pixels = img.width * img.height;
      const maxPixels = 10_000_000;
      if (pixels > maxPixels) {
        const scale = Math.sqrt(maxPixels / pixels);
        const resized = img.resize(scale, { kernel: "lanczos3" });
        img.delete();
        img = resized;
      }
    }

    let out: { buffer: ArrayBuffer; mime: string };
    if (options.format === "image/avif") {
      let working = img;
      let success: { buffer: ArrayBuffer; mime: string } | null = null;
      const qStart = selectedQuality ?? 0.62;
      const avifQualities = [qStart, 0.56, 0.5, 0.44];

      for (let i = 0; i < 4 && !success; i += 1) {
        for (const q of avifQualities) {
          try {
            success = writeImage(working, "image/avif", q);
            break;
          } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            const transientAvifFailure =
              msg.includes("av1_create_context_and_bufferpool") ||
              msg.includes("VipsForeignSaveAvifTarget");
            if (!transientAvifFailure) throw error;
          }
        }
        if (success) break;
        if (working.width < 720 || working.height < 720) break;
        const downscaled = working.resize(0.8, { kernel: "lanczos3" });
        if (working !== img) working.delete();
        working = downscaled;
      }
      if (working !== img) working.delete();
      if (!success) {
        img.delete();
        throw new Error("AVIF encoder failed for this image. Try WebP/JPEG or reduce image dimensions.");
      }
      out = success;
    } else {
      out = writeImage(img, options.format, selectedQuality);
    }

    if (
      file.type === options.format &&
      options.quality == null &&
      out.buffer.byteLength >= file.buffer.byteLength
    ) {
      img.delete();
      const copy = file.buffer.slice(0);
      return transfer({ buffer: copy, mime: file.type || options.format }, [copy]);
    }

    if (sizeSafe && out.buffer.byteLength > targetThreshold && isLossyFormat(options.format)) {
      let best = out;
      const startQuality = selectedQuality ?? defaultQualityForFormat(options.format) ?? 0.82;
      const qualitySteps = [0.82, 0.76, 0.7, 0.64, 0.58, 0.52, 0.46, 0.4]
        .filter((q) => q < startQuality);
      qualitySteps.unshift(startQuality);

      for (const q of qualitySteps) {
        const candidate = writeImage(img, options.format, q);
        if (candidate.buffer.byteLength < best.buffer.byteLength) {
          best = candidate;
        }
        if (candidate.buffer.byteLength <= targetThreshold) {
          best = candidate;
          break;
        }
      }
      out = best;
    }

    if (sizeSafe && out.buffer.byteLength > targetThreshold && (options.format === "image/png" || options.format === "image/tiff")) {
      let best = out;

      // If still too large, gradually downscale to keep exported size practical.
      if (best.buffer.byteLength > targetThreshold) {
        let working = img;
        let workingOut = best;
        for (let i = 0; i < 3; i += 1) {
          const ratioFromSize = Math.sqrt(targetThreshold / Math.max(1, workingOut.buffer.byteLength));
          const scale = Math.max(0.68, Math.min(0.9, ratioFromSize * 0.97));
          if (scale >= 0.99 || working.width < 720 || working.height < 720) break;

          const resized = working.resize(scale, { kernel: "lanczos3" });
          if (working !== img) working.delete();
          working = resized;

          const candidate = writeImage(
            working,
            options.format,
            options.format === "image/png" ? 0.72 : selectedQuality,
          );
          if (candidate.buffer.byteLength < workingOut.buffer.byteLength) {
            workingOut = candidate;
          }
          if (candidate.buffer.byteLength <= targetThreshold) {
            workingOut = candidate;
            break;
          }
        }
        if (working !== img) working.delete();
        best = workingOut;
      }

      out = best;
    }

    img.delete();

    if (sizeSafe && file.type === options.format && out.buffer.byteLength > file.buffer.byteLength) {
      const copy = file.buffer.slice(0);
      return transfer({ buffer: copy, mime: file.type || options.format }, [copy]);
    }

    return transfer(out, [out.buffer]);
  },

  async compress(file: WorkerImageInput, options: CompressImageOptions): Promise<{ buffer: ArrayBuffer; mime: string }> {
    const t0 = performance.now();
    const vips = await getVips(needsHeif(file, options.format));
    const tInit = performance.now();
    let img = vips.Image.newFromBuffer(file.buffer);
    const origW = img.width;
    const origH = img.height;

    const target = fitWithinBox(origW, origH, options.maxWidth, options.maxHeight);

    if (target.width !== origW || target.height !== origH) {
      const scale = target.width / origW;
      const resized = img.resize(scale, { kernel: "lanczos3" });
      img.delete();
      img = resized;
    }

    const out = writeImage(img, options.format, options.quality);
    img.delete();
    const elapsed = performance.now() - t0;
    console.log(
      `[image-worker] compress: ${file.name} ${origW}x${origH}→${target.width}x${target.height} ` +
      `Q=${options.quality} ${options.format} in ${elapsed.toFixed(0)}ms ` +
      `(init=${(tInit - t0).toFixed(0)}ms, process=${(performance.now() - tInit).toFixed(0)}ms) ` +
      `${(file.buffer.byteLength / 1024).toFixed(0)}KB→${(out.buffer.byteLength / 1024).toFixed(0)}KB`,
    );

    // Never produce a file larger than the original — return the input unchanged
    if (out.buffer.byteLength >= file.buffer.byteLength) {
      const copy = file.buffer.slice(0);
      return transfer({ buffer: copy, mime: file.type || options.format }, [copy]);
    }

    return transfer(out, [out.buffer]);
  },

  async resize(file: WorkerImageInput, options: ResizeImageOptions): Promise<{ buffer: ArrayBuffer; mime: string }> {
    const vips = await getVips(needsHeif(file, options.format) || inputMightBeHeic(file));
    let img = vips.Image.newFromBuffer(file.buffer);
    const srcW = img.width;
    const srcH = img.height;

    // Passthrough: if target dimensions match source and format matches input, return original buffer
    const inputMime = file.type || "";
    if (options.width === srcW && options.height === srcH && inputMime === options.format) {
      img.delete();
      const copy = file.buffer.slice(0);
      return transfer({ buffer: copy, mime: options.format }, [copy]);
    }

    const scaleX = options.width / srcW;
    const scaleY = options.height / srcH;
    const resized = img.resize(scaleX, { vscale: scaleY, kernel: "lanczos3" });
    img.delete();
    img = resized;
    const out = writeImage(img, options.format, options.quality);
    img.delete();
    return transfer(out, [out.buffer]);
  },

  async crop(file: WorkerImageInput, options: CropImageOptions): Promise<{ buffer: ArrayBuffer; mime: string }> {
    const vips = await getVips(needsHeif(file, options.format));
    let img = vips.Image.newFromBuffer(file.buffer);

    // Crop first — coordinates match what the user drew on the un-transformed image
    const { x, y, width, height } = options.area;
    const cropped = img.extractArea(
      Math.round(x),
      Math.round(y),
      Math.max(1, Math.round(width)),
      Math.max(1, Math.round(height)),
    );
    img.delete();
    img = cropped;

    // Apply rotation after crop
    const rot = options.rotation ?? 0;
    if (rot !== 0) {
      if (rot === 90 || rot === 180 || rot === 270) {
        const angles: Record<number, string> = { 90: "d90", 180: "d180", 270: "d270" };
        const rotated = img.rot(angles[rot]);
        img.delete();
        img = rotated;
      } else {
        const rotated = img.similarity({ angle: rot });
        img.delete();
        img = rotated;
      }
    }

    // Apply flip after crop
    const flip = options.flip ?? "none";
    if (flip === "horizontal" || flip === "both") {
      const flipped = img.fliphor();
      img.delete();
      img = flipped;
    }
    if (flip === "vertical" || flip === "both") {
      const flipped = img.flipver();
      img.delete();
      img = flipped;
    }

    const out = writeImage(img, options.format, options.quality);
    img.delete();
    return transfer(out, [out.buffer]);
  },

  async watermarkText(file: WorkerImageInput, options: WatermarkTextOptions): Promise<{ buffer: ArrayBuffer; mime: string }> {
    const loaded = await loadInputImageWithRetry(file);
    const vips = loaded.vips;
    let img = loaded.image;

    if (!img.hasAlpha()) {
      const withAlpha = img.bandjoin(255);
      img.delete();
      img = withAlpha;
    }

    const overlayBuffer = await renderTextOverlayBuffer(options);
    let overlay = vips.Image.newFromBuffer(overlayBuffer);
    const rotation = options.rotation ?? 0;
    if (rotation !== 0) {
      const rotated = overlay.similarity({ angle: rotation });
      overlay.delete();
      overlay = rotated;
    }

    const margin = Math.max(12, Math.round(options.fontSize * 0.6));
    let posX: number;
    let posY: number;
    switch (options.position) {
      case "top-left":
        posX = margin; posY = margin; break;
      case "top-center":
        posX = Math.round((img.width - overlay.width) / 2); posY = margin; break;
      case "top-right":
        posX = img.width - overlay.width - margin; posY = margin; break;
      case "middle-left":
        posX = margin; posY = Math.round((img.height - overlay.height) / 2); break;
      case "middle-right":
        posX = img.width - overlay.width - margin; posY = Math.round((img.height - overlay.height) / 2); break;
      case "bottom-left":
        posX = margin; posY = img.height - overlay.height - margin; break;
      case "bottom-center":
        posX = Math.round((img.width - overlay.width) / 2); posY = img.height - overlay.height - margin; break;
      case "bottom-right":
        posX = img.width - overlay.width - margin; posY = img.height - overlay.height - margin; break;
      case "center":
      default:
        posX = Math.round((img.width - overlay.width) / 2);
        posY = Math.round((img.height - overlay.height) / 2);
        break;
    }

    let composited;
    if (options.position === "mosaic") {
      let current = img;
      const tileW = current.width / 3;
      const tileH = current.height / 3;
      for (let row = 0; row < 3; row += 1) {
        for (let col = 0; col < 3; col += 1) {
          const centerX = Math.round(col * tileW + tileW / 2);
          const centerY = Math.round(row * tileH + tileH / 2);
          const x = Math.round(centerX - overlay.width / 2);
          const y = Math.round(centerY - overlay.height / 2);
          const next = current.composite2(overlay, "over", { x, y });
          if (current !== img) current.delete();
          current = next;
        }
      }
      composited = current;
      if (img !== composited) img.delete();
    } else {
      composited = img.composite2(overlay, "over", { x: posX, y: posY });
      img.delete();
    }

    overlay.delete();
    const out = writeImage(composited, options.format, options.quality);
    composited.delete();
    return transfer(out, [out.buffer]);
  },

  // -------------------------------------------------------------------------
  // Batch methods
  // -------------------------------------------------------------------------

  async batchConvert(jobs: Array<WorkerBatchJob<ConvertImageOptions>>): Promise<WorkerBatchResult[]> {
    const results: WorkerBatchResult[] = [];
    for (const job of jobs) {
      try {
        const out = await api.convert(job.file, job.options);
        results.push({ id: job.id, status: "success", ...out });
      } catch (error) {
        results.push({ id: job.id, status: "error", error: error instanceof Error ? error.message : "Unknown error" });
      }
    }
    const transferables = results
      .filter((r): r is Extract<WorkerBatchResult, { status: "success" }> => r.status === "success")
      .map((r) => r.buffer as Transferable);
    return transfer(results, transferables);
  },

  async batchCompress(jobs: Array<WorkerBatchJob<CompressImageOptions>>): Promise<WorkerBatchResult[]> {
    const results: WorkerBatchResult[] = [];
    for (const job of jobs) {
      try {
        const out = await api.compress(job.file, job.options);
        results.push({ id: job.id, status: "success", ...out });
      } catch (error) {
        results.push({ id: job.id, status: "error", error: error instanceof Error ? error.message : "Unknown error" });
      }
    }
    const transferables = results
      .filter((r): r is Extract<WorkerBatchResult, { status: "success" }> => r.status === "success")
      .map((r) => r.buffer as Transferable);
    return transfer(results, transferables);
  },

  async batchResize(jobs: Array<WorkerBatchJob<ResizeImageOptions>>): Promise<WorkerBatchResult[]> {
    const results: WorkerBatchResult[] = [];
    for (const job of jobs) {
      try {
        const out = await api.resize(job.file, job.options);
        results.push({ id: job.id, status: "success", ...out });
      } catch (error) {
        results.push({ id: job.id, status: "error", error: error instanceof Error ? error.message : "Unknown error" });
      }
    }
    const transferables = results
      .filter((r): r is Extract<WorkerBatchResult, { status: "success" }> => r.status === "success")
      .map((r) => r.buffer as Transferable);
    return transfer(results, transferables);
  },

  async batchWatermarkText(jobs: Array<WorkerBatchJob<WatermarkTextOptions>>): Promise<WorkerBatchResult[]> {
    const results: WorkerBatchResult[] = [];
    for (const job of jobs) {
      try {
        const out = await api.watermarkText(job.file, job.options);
        results.push({ id: job.id, status: "success", ...out });
      } catch (error) {
        results.push({ id: job.id, status: "error", error: error instanceof Error ? error.message : "Unknown error" });
      }
    }
    const transferables = results
      .filter((r): r is Extract<WorkerBatchResult, { status: "success" }> => r.status === "success")
      .map((r) => r.buffer as Transferable);
    return transfer(results, transferables);
  },
};

export type ImageWorkerAPI = typeof api;

expose(api);
