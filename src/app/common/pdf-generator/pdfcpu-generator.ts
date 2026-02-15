/**
 * PDFCPU based PDF Generator
 * Primary implementation using pdfcpu WASM (when available)
 *
 * Note: Currently pdfcpu worker doesn't expose image-to-pdf functionality.
 * This generator will throw to trigger fallback to pdf-lib.
 * When pdfcpu worker is updated with import command, this can be implemented.
 */

import {
  ImageInput,
  ImageToPdfOptions,
  IPdfGenerator,
} from "./types";

// Declare Comlink on window
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Comlink: any;
  }
}

export class PdfcpuGenerator implements IPdfGenerator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private workerInstance: any = null;
  private isInitialized = false;

  /**
   * Load Comlink library if not already loaded
   */
  private async loadComlink(): Promise<void> {
    if (typeof window === "undefined") {
      throw new Error("pdfcpu only works in browser environment");
    }

    if (!window.Comlink) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "/js/comlinkjs/3.1.1/umd/comlink.js";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Comlink"));
        document.head.appendChild(script);
      });
    }
  }

  /**
   * Initialize the pdfcpu worker
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    await this.loadComlink();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const WorkerThread: any = window.Comlink.proxy(
      new window.Worker("/js/pdfcpu/worker.js")
    );

    const workerInstancePromise = new WorkerThread();
    this.workerInstance = await workerInstancePromise;
    this.isInitialized = true;
  }

  /**
   * Generate PDF from images using pdfcpu
   *
   * Note: This method currently throws because pdfcpu worker doesn't have
   * image-to-pdf functionality. When the worker is updated with the import
   * command, this can be implemented.
   */
  /* eslint-disable @typescript-eslint/no-unused-vars */
  async generatePdf(
    images: ImageInput[],
    options: ImageToPdfOptions
  ): Promise<Uint8Array> {
    /* eslint-enable @typescript-eslint/no-unused-vars */
    await this.initialize();

    // TODO: Implement when pdfcpu worker exposes import command
    // The pdfcpu CLI command would be:
    // pdfcpu import -pages A4 output.pdf image1.jpg image2.png ...
    //
    // For now, throw to trigger fallback to pdf-lib
    throw new Error("pdfcpu image-to-pdf not implemented yet");
  }
}

// Singleton instance
let pdfcpuGeneratorInstance: PdfcpuGenerator | null = null;

export default function getPdfcpuGenerator(): PdfcpuGenerator {
  if (!pdfcpuGeneratorInstance) {
    pdfcpuGeneratorInstance = new PdfcpuGenerator();
  }
  return pdfcpuGeneratorInstance;
}
