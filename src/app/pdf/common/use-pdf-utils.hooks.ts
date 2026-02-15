import { useEffect, useMemo, useRef, useState } from "react";
import {
  CompressOptions,
  CropOptions,
  DecryptOptions,
  EncryptOptions,
  FileObject,
  ImageInput,
  ImageToPdfOptions,
  ImageWatermarkOptions,
  IPdfUtilsLib,
  PageNumberOptions,
  RotateOptions,
  TextWatermarkOptions,
  WatermarkSettings,
} from "./types";
import { FileUploaded } from "@/app/common/hooks";
import { PageDimensionInfo } from "./pdf-lib";
import PDFCpuUtils from "./pdf-cpu";

// Extended interface for pdfcpu methods
interface IPdfCPUExtended extends IPdfUtilsLib {
  rotate(buffer: ArrayBuffer, options: RotateOptions): Promise<Uint8Array>;
  encrypt(buffer: ArrayBuffer, options: EncryptOptions): Promise<Uint8Array>;
  decrypt(buffer: ArrayBuffer, options: DecryptOptions): Promise<Uint8Array>;
}

// Extended interface for pdf-lib worker methods
interface IPdfLibExtended extends IPdfUtilsLib {
  applyTextWatermark(
    pdfBytes: ArrayBuffer,
    settings: WatermarkSettings,
  ): Promise<Uint8Array>;
  applyImageWatermark(
    pdfBytes: ArrayBuffer,
    settings: WatermarkSettings,
  ): Promise<Uint8Array>;
  crop(pdfBytes: ArrayBuffer, options: CropOptions): Promise<Uint8Array>;
  getPageDimensions(pdfBytes: ArrayBuffer): Promise<PageDimensionInfo[]>;
  rotate(pdfBytes: ArrayBuffer, options: RotateOptions): Promise<Uint8Array>;
  addPageNumbers(
    pdfBytes: ArrayBuffer,
    options: PageNumberOptions,
  ): Promise<Uint8Array>;
  deletePages(
    pdfBytes: ArrayBuffer,
    pageIndices: number[],
  ): Promise<Uint8Array>;
  reorderPages(pdfBytes: ArrayBuffer, newOrder: number[]): Promise<Uint8Array>;
  insertBlankPage(
    pdfBytes: ArrayBuffer,
    atIndex: number,
    pageSize?: { width: number; height: number },
  ): Promise<Uint8Array>;
}

interface FallbackTask<T> {
  name: string;
  fn: (() => Promise<T>) | undefined;
}

/**
 * Execute tasks in order, falling back to the next on failure.
 */
async function withFallback<T>(
  label: string,
  ...tasks: FallbackTask<T>[]
): Promise<T> {
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    if (!task.fn) continue;

    const start = performance.now();
    const isLast = i === tasks.length - 1;

    try {
      console.log(`[${label}] executing "${task.name}"...`);
      const result = await task.fn();
      const elapsed = (performance.now() - start).toFixed(0);
      console.log(`[${label}] "${task.name}" completed in ${elapsed}ms`);
      return result;
    } catch (err) {
      const elapsed = (performance.now() - start).toFixed(0);
      if (isLast) {
        console.error(
          `[${label}] "${task.name}" failed after ${elapsed}ms:`,
          err,
        );
        throw err;
      }
      const next = tasks.slice(i + 1).find((t) => t.fn);
      console.warn(
        `[${label}] "${task.name}" failed after ${elapsed}ms, falling back to "${next?.name ?? "none"}"`,
        err,
      );
    }
  }

  throw new Error(`[${label}] No available implementation`);
}

export function usePDFUtils() {
  const [isLoaded, setIsLoaded] = useState(false);
  const pdfCPU = useRef<IPdfCPUExtended | undefined>(undefined);
  const pdfLib = useRef<IPdfLibExtended | undefined>(undefined);

  const loadPdfCPU = async () => {
    if (!pdfCPU.current) {
      const moduleExport = await import("./pdf-cpu").then(
        (module) => module.default,
      );
      pdfCPU.current = new moduleExport() as IPdfCPUExtended;
    }
  };

  const operations = useMemo(
    () => ({
      merge: async (
        files: Array<{ id: string; file: File }>,
      ): Promise<Uint8Array> => {
        const fileBuffersPromise = files.map((file) => file.file.arrayBuffer());
        const fileBuffers = await Promise.all(fileBuffersPromise);

        const filesToProcess = files.map((file, i) => ({
          id: file.id,
          buffer: fileBuffers[i],
        }));

        return pdfLib.current!.merge(filesToProcess);
      },

      split: (file: FileObject, ranges: number[][]): Promise<Uint8Array[]> => {
        return pdfLib.current!.split(file, ranges);
      },

      embedImages: (
        images: ImageInput[],
        options: ImageToPdfOptions,
      ): Promise<Uint8Array> => {
        return pdfLib.current!.embedImages(images, options);
      },

      getTotalPages: (file: FileObject) => {
        return pdfLib.current!.getPageCount(file);
      },

      async compress(file: FileObject, options?: CompressOptions) {
        await loadPdfCPU();
        return pdfCPU.current!.compress(file, options);
      },

      watermarkText(file: FileObject, options: TextWatermarkOptions) {
        return pdfLib.current!.watermarkText!(file, options);
      },

      watermarkImage(
        file: FileObject,
        imageBuffer: ArrayBuffer,
        imageName: string,
        options: ImageWatermarkOptions,
      ) {
        return pdfLib.current!.watermarkImage!(
          file,
          imageBuffer,
          imageName,
          options,
        );
      },

      applyTextWatermark(
        pdfBytes: ArrayBuffer,
        settings: WatermarkSettings,
      ): Promise<Uint8Array> {
        return (pdfLib.current as IPdfLibExtended).applyTextWatermark(
          pdfBytes,
          settings,
        );
      },

      applyImageWatermark(
        pdfBytes: ArrayBuffer,
        settings: WatermarkSettings,
      ): Promise<Uint8Array> {
        return (pdfLib.current as IPdfLibExtended).applyImageWatermark(
          pdfBytes,
          settings,
        );
      },

      crop(pdfBytes: ArrayBuffer, options: CropOptions): Promise<Uint8Array> {
        return (pdfLib.current as IPdfLibExtended).crop(pdfBytes, options);
      },

      getPageDimensions(pdfBytes: ArrayBuffer): Promise<PageDimensionInfo[]> {
        return (pdfLib.current as IPdfLibExtended).getPageDimensions(pdfBytes);
      },

      rotate(
        pdfBytes: ArrayBuffer,
        options: RotateOptions,
      ): Promise<Uint8Array> {
        return (pdfLib.current as IPdfLibExtended).rotate(pdfBytes, options);
      },

      async encrypt(
        pdfBytes: ArrayBuffer,
        options: EncryptOptions,
      ): Promise<Uint8Array> {
        await loadPdfCPU();

        return (pdfCPU.current as IPdfCPUExtended).encrypt(pdfBytes, options);
      },

      async decrypt(
        pdfBytes: ArrayBuffer,
        options: DecryptOptions,
      ): Promise<Uint8Array> {
        await loadPdfCPU();

        return (pdfCPU.current as IPdfCPUExtended).decrypt(pdfBytes, options);
      },

      addPageNumbers(
        pdfBytes: ArrayBuffer,
        options: PageNumberOptions,
      ): Promise<Uint8Array> {
        return (pdfLib.current as IPdfLibExtended).addPageNumbers(
          pdfBytes,
          options,
        );
      },

      deletePages(
        pdfBytes: ArrayBuffer,
        pageIndices: number[],
      ): Promise<Uint8Array> {
        return (pdfLib.current as IPdfLibExtended).deletePages(
          pdfBytes,
          pageIndices,
        );
      },

      reorderPages(
        pdfBytes: ArrayBuffer,
        newOrder: number[],
      ): Promise<Uint8Array> {
        return (pdfLib.current as IPdfLibExtended).reorderPages(
          pdfBytes,
          newOrder,
        );
      },

      insertBlankPage(
        pdfBytes: ArrayBuffer,
        atIndex: number,
        pageSize?: { width: number; height: number },
      ): Promise<Uint8Array> {
        return (pdfLib.current as IPdfLibExtended).insertBlankPage(
          pdfBytes,
          atIndex,
          pageSize,
        );
      },
    }),
    [],
  );

  useEffect(() => {
    const shouldLoadLib = !isLoaded && !pdfLib.current;
    if (shouldLoadLib) {
      import("./pdf-lib").then((module) => {
        pdfLib.current = new module.default() as IPdfLibExtended;
        setIsLoaded(true);
      });
    }
  }, [isLoaded]);

  /**
   * let it load on the page, light file should be okay to load
   */
  useEffect(() => {
    async function loadPdfCPU() {
      if (!pdfCPU.current) {
        await import("./pdf-cpu")
          .then((module) => module.default)
          .then((moduleExport) => {
            pdfCPU.current = new moduleExport();
          })
          .catch((err) => {
            console.error("Failed to load pdf-cpu:", err);
          });
      }
    }
    loadPdfCPU();
  }, []);

  return [isLoaded, operations] as const;
}

export function fakeTransformFileWithPages(files: FileUploaded[]) {
  return files.map((file) => ({
    ...file,
    pages: [],
  }));
}
