/**
 * pdfcpu Web Worker — uses pdfcpu-wasm (WASI-based) npm package.
 *
 * Communicates via postMessage with { id, args, files, outputPaths } requests
 * and { id, outputs, error } responses.
 */

import { Pdfcpu } from "/js/pdfcpu/pdfcpu-wasm.js";

const pdfcpu = new Pdfcpu("/js/pdfcpu/pdfcpu.wasm");

// ---- Message handler ----

self.onmessage = async (e) => {
  const { id, args, files, outputPaths, options } = e.data;

  try {
    // Convert input file buffers to File objects (pdfcpu-wasm API)
    const inputFiles = files
      .filter((f) => f.buffer && f.buffer.byteLength > 0)
      .map((f) => new File([f.buffer], f.name));

    console.log("[pdfcpu-worker] run #" + id + ": pdfcpu " + args.join(" "));
    const start = performance.now();

    const outputHandle = await pdfcpu.run(args, inputFiles);

    const elapsed = (performance.now() - start).toFixed(0);
    console.log("[pdfcpu-worker] run #" + id + " done in " + elapsed + "ms");

    // Read requested output files (or everything in /output when no paths are provided)
    const outputs = [];
    const requestedPaths =
      Array.isArray(outputPaths) && outputPaths.length > 0
        ? outputPaths
        : listAllOutputFiles(outputHandle);

    for (const path of requestedPaths) {
      const file = await readOutputFile(outputHandle, path);
      if (file) {
        const buffer = await file.arrayBuffer();
        const shouldSkip =
          options?.skipLikelyMaskAssets &&
          /\.(png|jpg|jpeg|webp|tif|tiff|jp2)$/i.test(path) &&
          (await isLikelyMaskAsset(buffer, file.type || inferMimeFromPath(path)));
        if (!shouldSkip) {
          outputs.push({ path, buffer });
        }
      } else {
        outputs.push({ path, buffer: null });
      }
    }

    const transferables = outputs.map((o) => o.buffer).filter((b) => b !== null);
    self.postMessage({ id, outputs }, transferables);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[pdfcpu-worker] error:", err);
    self.postMessage({ id, error: message });
  }
};

function listAllOutputFiles(outputHandle) {
  // pdfcpu-wasm exposes an in-memory dir tree at outputHandle.dir.
  // We walk it and collect relative file paths for readFile(path).
  const root = outputHandle?.dir;
  if (!root?.contents || typeof root.contents.entries !== "function") {
    return [];
  }

  const files = [];

  const walk = (node, prefix = "") => {
    if (!node?.contents || typeof node.contents.entries !== "function") {
      return;
    }

    for (const [name, entry] of node.contents.entries()) {
      const path = prefix ? `${prefix}/${name}` : name;
      if (entry?.contents && typeof entry.contents.entries === "function") {
        walk(entry, path);
      } else if (entry?.data && typeof entry.data.byteLength === "number") {
        files.push(path);
      }
    }
  };

  walk(root, "");
  return Array.from(new Set(files));
}

async function readOutputFile(outputHandle, path) {
  // pdfcpu-wasm may expose different path roots depending on runtime.
  // Try a few variants before giving up.
  const variants = [
    path,
    path.replace(/^\/+/, ""),
    path.replace(/^output\//, ""),
    path.replace(/^\/?output\//, ""),
    path.split("/").pop(),
  ].filter(Boolean);

  for (const candidate of variants) {
    try {
      const file = await outputHandle.readFile(candidate);
      if (file) return file;
    } catch (_) {
      // Continue trying other variants.
    }
  }

  return null;
}

function inferMimeFromPath(path) {
  const lower = String(path || "").toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".tif") || lower.endsWith(".tiff")) return "image/tiff";
  if (lower.endsWith(".jp2")) return "image/jp2";
  return "image/png";
}

async function isLikelyMaskAsset(buffer, mimeType) {
  try {
    if (typeof createImageBitmap !== "function" || typeof OffscreenCanvas === "undefined") {
      return false;
    }

    const blob = new Blob([buffer], { type: mimeType || "image/png" });
    const bitmap = await createImageBitmap(blob);
    const width = bitmap.width;
    const height = bitmap.height;
    if (!width || !height) return false;

    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return false;
    ctx.drawImage(bitmap, 0, 0);

    const { data } = ctx.getImageData(0, 0, width, height);
    const totalPixels = width * height;
    const stride = Math.max(1, Math.floor(totalPixels / 12000));

    let n = 0;
    let sum = 0;
    let sumSq = 0;
    let alphaCount = 0;
    let nearBlack = 0;
    let nearWhite = 0;

    for (let i = 0; i < totalPixels; i += stride) {
      const idx = i * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];
      const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;

      n += 1;
      sum += l;
      sumSq += l * l;
      if (a > 0) alphaCount += 1;
      if (l < 18) nearBlack += 1;
      if (l > 237) nearWhite += 1;
    }

    if (n === 0) return false;
    const mean = sum / n;
    const variance = Math.max(0, sumSq / n - mean * mean);
    const std = Math.sqrt(variance);
    const blackRatio = nearBlack / n;
    const whiteRatio = nearWhite / n;
    const visibleRatio = alphaCount / n;

    return visibleRatio > 0.95 && std < 12 && (blackRatio > 0.9 || whiteRatio > 0.9);
  } catch (_) {
    return false;
  }
}
