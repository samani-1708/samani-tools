import {
  CropBox,
  CropOptions,
  FileObject,
  ImageInput,
  ImageToPdfOptions,
  IPdfUtilsLib,
  WatermarkSettings,
  RotateOptions,
  PageNumberOptions,
} from "./types";

// Page dimension info returned by getPageDimensions
export interface PageDimensionInfo {
  width: number;
  height: number;
  mediaBox: { x: number; y: number; width: number; height: number };
  cropBox: { x: number; y: number; width: number; height: number } | null;
}

// Worker instance type (proxied through Comlink)
interface PDFLibWorkerInstance {
  getPageCount(buffer: ArrayBuffer): Promise<number>;
  merge(files: Array<{ id: string; buffer: ArrayBuffer }>): Promise<Uint8Array>;
  split(buffer: ArrayBuffer, ranges: number[][]): Promise<Uint8Array[]>;
  compress(buffer: ArrayBuffer): Promise<Uint8Array>;
  embedImages(
    images: Array<{ buffer: ArrayBuffer; type: string }>,
    options: { orientation: string; pageSize: string; margin: string }
  ): Promise<Uint8Array>;
  applyTextWatermark(buffer: ArrayBuffer, settings: WatermarkSettings): Promise<Uint8Array>;
  applyImageWatermark(
    pdfBuffer: ArrayBuffer,
    imageBuffer: ArrayBuffer,
    imageType: string,
    settings: WatermarkSettings
  ): Promise<Uint8Array>;
  crop(buffer: ArrayBuffer, options: CropOptions): Promise<Uint8Array>;
  getPageDimensions(buffer: ArrayBuffer): Promise<PageDimensionInfo[]>;
  rotate(buffer: ArrayBuffer, options: RotateOptions): Promise<Uint8Array>;
  addPageNumbers(buffer: ArrayBuffer, options: PageNumberOptions): Promise<Uint8Array>;
  deletePages(buffer: ArrayBuffer, pageIndices: number[]): Promise<Uint8Array>;
  reorderPages(buffer: ArrayBuffer, newOrder: number[]): Promise<Uint8Array>;
  insertBlankPage(buffer: ArrayBuffer, atIndex: number, pageSize?: { width: number; height: number }): Promise<Uint8Array>;
}

export default class PDFUtils implements IPdfUtilsLib {
  private static _workerInstance: PDFLibWorkerInstance | null = null;
  private static _initPromise: Promise<void> | null = null;

  public static async init(): Promise<number> {
    if (this._initPromise) {
      await this._initPromise;
      return 1;
    }

    this._initPromise = this._initializeWorker();
    await this._initPromise;
    return 1;
  }

  private static async _initializeWorker(): Promise<void> {
    // Ensure Comlink is loaded
    if (!window.Comlink) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "/js/comlinkjs/3.1.1/umd/comlink.js";
        script.onload = () => resolve();
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    // Create worker and proxy it
    const WorkerClass = await (window.Comlink as typeof import("comlink")).proxy(
      new Worker("/js/pdflib/worker.js")
    ) as new () => Promise<PDFLibWorkerInstance>;

    this._workerInstance = await new WorkerClass();
    console.log("PDF-Lib Worker initialized");
  }

  private async _getWorker(): Promise<PDFLibWorkerInstance> {
    if (!PDFUtils._workerInstance) {
      await PDFUtils.init();
    }
    return PDFUtils._workerInstance!;
  }

  public async getPageCount(fileObject: FileObject): Promise<number> {
    const worker = await this._getWorker();
    return worker.getPageCount(fileObject.buffer);
  }

  public async merge(files: FileObject[]): Promise<Uint8Array> {
    const worker = await this._getWorker();
    return worker.merge(files);
  }

  public async split(file: FileObject, ranges: number[][]): Promise<Uint8Array[]> {
    const worker = await this._getWorker();
    return worker.split(file.buffer, ranges);
  }

  public async compress(file: FileObject): Promise<Uint8Array> {
    const worker = await this._getWorker();
    return worker.compress(file.buffer);
  }

  public async embedImages(
    images: ImageInput[],
    options: ImageToPdfOptions
  ): Promise<Uint8Array> {
    const worker = await this._getWorker();
    return worker.embedImages(images, options);
  }

  public async applyTextWatermark(
    pdfBytes: ArrayBuffer,
    settings: WatermarkSettings
  ): Promise<Uint8Array> {
    const worker = await this._getWorker();
    return worker.applyTextWatermark(pdfBytes, settings);
  }

  public async applyImageWatermark(
    pdfBytes: ArrayBuffer,
    settings: WatermarkSettings
  ): Promise<Uint8Array> {
    if (!settings.imageFile) {
      throw new Error("No image file provided");
    }

    const worker = await this._getWorker();
    const imageBuffer = await settings.imageFile.arrayBuffer();
    const imageType = settings.imageFile.type;

    return worker.applyImageWatermark(pdfBytes, imageBuffer, imageType, settings);
  }

  public async crop(
    pdfBytes: ArrayBuffer,
    options: CropOptions
  ): Promise<Uint8Array> {
    const worker = await this._getWorker();
    return worker.crop(pdfBytes, options);
  }

  public async getPageDimensions(
    pdfBytes: ArrayBuffer
  ): Promise<PageDimensionInfo[]> {
    const worker = await this._getWorker();
    return worker.getPageDimensions(pdfBytes);
  }

  public async rotate(
    pdfBytes: ArrayBuffer,
    options: RotateOptions
  ): Promise<Uint8Array> {
    const worker = await this._getWorker();
    return worker.rotate(pdfBytes, options);
  }

  public async addPageNumbers(
    pdfBytes: ArrayBuffer,
    options: PageNumberOptions
  ): Promise<Uint8Array> {
    const worker = await this._getWorker();
    return worker.addPageNumbers(pdfBytes, options);
  }

  public async deletePages(
    pdfBytes: ArrayBuffer,
    pageIndices: number[]
  ): Promise<Uint8Array> {
    const worker = await this._getWorker();
    return worker.deletePages(pdfBytes, pageIndices);
  }

  public async reorderPages(
    pdfBytes: ArrayBuffer,
    newOrder: number[]
  ): Promise<Uint8Array> {
    const worker = await this._getWorker();
    return worker.reorderPages(pdfBytes, newOrder);
  }

  public async insertBlankPage(
    pdfBytes: ArrayBuffer,
    atIndex: number,
    pageSize?: { width: number; height: number }
  ): Promise<Uint8Array> {
    const worker = await this._getWorker();
    return worker.insertBlankPage(pdfBytes, atIndex, pageSize);
  }
}
