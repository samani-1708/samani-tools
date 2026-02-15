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
  const { id, args, files, outputPaths } = e.data;

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

    // Read requested output files
    const outputs = [];
    for (const path of outputPaths) {
      const file = await outputHandle.readFile(path);
      if (file) {
        const buffer = await file.arrayBuffer();
        outputs.push({ path, buffer });
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
