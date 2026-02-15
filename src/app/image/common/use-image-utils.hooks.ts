"use client";

import { transfer, wrap, type Remote } from "comlink";
import { useEffect, useMemo, useRef, useState } from "react";
import { fitWithinBox } from "./image-utils";
import type { ImageWorkerAPI } from "./image.worker";

export type ImageWatermarkPosition =
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

export type EncodableImageFormat = "image/png" | "image/jpeg" | "image/webp" | "image/avif" | "image/tiff";
export type ConversionMode = "fast" | "balanced" | "max_quality";

export interface ConvertImageOptions {
  format: EncodableImageFormat;
  quality?: number;
  sizeSafe?: boolean;
  maxSizeMultiplier?: number;
  mode?: ConversionMode;
}

export interface CompressImageOptions {
  quality: number;
  maxWidth?: number;
  maxHeight?: number;
  format: EncodableImageFormat;
}

export interface ResizeImageOptions {
  width: number;
  height: number;
  format: EncodableImageFormat;
  quality?: number;
}

export interface CropImageOptions {
  area: { x: number; y: number; width: number; height: number };
  format: EncodableImageFormat;
  quality?: number;
  rotation?: number;
  flip?: "horizontal" | "vertical" | "both" | "none";
}

export interface WatermarkTextOptions {
  text: string;
  fontSize: number;
  opacity: number;
  color: string;
  position: ImageWatermarkPosition;
  rotation?: number;
  format: EncodableImageFormat;
  quality?: number;
}

export interface ImageBatchJob<TOptions> {
  id?: string;
  file: File;
  options: TOptions;
  outputFileName?: string;
}

export interface ImageBatchSuccess {
  id: string;
  status: "success";
  file: File;
  blob: Blob;
  outputFileName: string;
}

export interface ImageBatchFailure {
  id: string;
  status: "error";
  file: File;
  error: string;
}

export type ImageBatchResult = ImageBatchSuccess | ImageBatchFailure;

interface WorkerImageInput {
  name: string;
  type: string;
  buffer: ArrayBuffer;
}

type WorkerBatchJob<TOptions> = {
  id: string;
  file: WorkerImageInput;
  options: TOptions;
};

type WorkerBatchResult =
  | { id: string; status: "success"; buffer: ArrayBuffer; mime: string }
  | { id: string; status: "error"; error: string };

type NormalizedBatchJob<TOptions> = {
  id: string;
  job: ImageBatchJob<TOptions>;
};

function getBatchJobId(job: ImageBatchJob<unknown>): string {
  if (job.id) return job.id;
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function extensionForFormat(format: EncodableImageFormat): string {
  if (format === "image/jpeg") return "jpg";
  if (format === "image/png") return "png";
  if (format === "image/webp") return "webp";
  if (format === "image/tiff") return "tiff";
  return "avif";
}

function getBaseName(filename: string): string {
  return filename.replace(/\.[^/.]+$/, "");
}

function buildOutputFileName(
  file: File,
  format: EncodableImageFormat,
  suffix?: string,
): string {
  const base = getBaseName(file.name);
  const ext = extensionForFormat(format);
  return suffix ? `${base}-${suffix}.${ext}` : `${base}.${ext}`;
}

async function toWorkerInput(file: File): Promise<WorkerImageInput> {
  return {
    name: file.name,
    type: file.type,
    buffer: await file.arrayBuffer(),
  };
}

function toBlob(buffer: ArrayBuffer, mime: string): Blob {
  return new Blob([buffer], { type: mime });
}

function normalizeBatchJobs<TOptions>(
  jobs: Array<ImageBatchJob<TOptions>>,
): Array<NormalizedBatchJob<TOptions>> {
  return jobs.map((job) => ({
    id: getBatchJobId(job),
    job,
  }));
}

export function useImageUtils() {
  const [isLoaded, setIsLoaded] = useState(false);
  const supportRef = useRef<Record<EncodableImageFormat, boolean> | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const remoteRef = useRef<Remote<ImageWorkerAPI> | null>(null);

  const getWorker = async () => {
    if (remoteRef.current) return remoteRef.current;

    const worker = new Worker(new URL("./image.worker.ts", import.meta.url), {
      type: "module",
    });

    workerRef.current = worker;
    remoteRef.current = wrap<ImageWorkerAPI>(worker);

    return remoteRef.current;
  };

  const resetWorker = () => {
    supportRef.current = null;
    remoteRef.current = null;
    workerRef.current?.terminate();
    workerRef.current = null;
  };

  const shouldRestartWorker = (error: unknown): boolean => {
    const message = error instanceof Error ? error.message : String(error);
    return (
      message.includes("RuntimeError: Aborted") ||
      message.includes("worker sent an error") ||
      message.includes("unwind") ||
      message.includes("failed to allocate") ||
      message.includes("VipsForeignSaveAvifTarget")
    );
  };

  const withWorkerRetry = async <T>(fn: (worker: Remote<ImageWorkerAPI>) => Promise<T>): Promise<T> => {
    try {
      const worker = await getWorker();
      return await fn(worker);
    } catch (error) {
      if (!shouldRestartWorker(error)) throw error;
      resetWorker();
      const worker = await getWorker();
      return await fn(worker);
    }
  };

  const operations = useMemo(() => {
    const callWithFileInput = async <T>(
      file: File,
      call: (worker: Remote<ImageWorkerAPI>, input: WorkerImageInput) => Promise<T>,
    ) => {
      return withWorkerRetry(async (worker) => {
        const input = await toWorkerInput(file);
        return call(worker, transfer(input, [input.buffer]));
      });
    };

    const callWithBatchInputs = async <TOptions, TResult>(
      jobs: Array<NormalizedBatchJob<TOptions>>,
      call: (worker: Remote<ImageWorkerAPI>, workerJobs: WorkerBatchJob<TOptions>[]) => Promise<TResult>,
    ) => {
      return withWorkerRetry(async (worker) => {
        const workerJobs: WorkerBatchJob<TOptions>[] = await Promise.all(
          jobs.map(async ({ id, job }) => ({
            id,
            file: await toWorkerInput(job.file),
            options: job.options,
          })),
        );
        const transferables = workerJobs.map((job) => job.file.buffer as Transferable);
        return call(worker, transfer(workerJobs, transferables));
      });
    };

    const getEncodeSupport = async () => {
      if (!supportRef.current) {
        supportRef.current = await withWorkerRetry((worker) => worker.getEncodeSupport());
      }
      return supportRef.current as Record<EncodableImageFormat, boolean>;
    };

    const readDimensions = async (file: File) => {
      return callWithFileInput(file, (worker, input) => worker.readDimensions(input));
    };

    const convert = async (file: File, options: ConvertImageOptions) => {
      const out = await callWithFileInput(file, (worker, input) =>
        worker.convert(input, options),
      );
      return toBlob(out.buffer, out.mime);
    };

    const compress = async (file: File, options: CompressImageOptions) => {
      const out = await callWithFileInput(file, (worker, input) =>
        worker.compress(input, options),
      );
      return toBlob(out.buffer, out.mime);
    };

    const resize = async (file: File, options: ResizeImageOptions) => {
      const out = await callWithFileInput(file, (worker, input) =>
        worker.resize(input, options),
      );
      return toBlob(out.buffer, out.mime);
    };

    const crop = async (file: File, options: CropImageOptions) => {
      const out = await callWithFileInput(file, (worker, input) =>
        worker.crop(input, options),
      );
      return toBlob(out.buffer, out.mime);
    };

    const watermarkText = async (file: File, options: WatermarkTextOptions) => {
      const out = await callWithFileInput(file, (worker, input) =>
        worker.watermarkText(input, options),
      );
      return toBlob(out.buffer, out.mime);
    };

    const mapBatchResults = <TOptions extends { format: EncodableImageFormat }>(
      normalizedJobs: Array<NormalizedBatchJob<TOptions>>,
      results: WorkerBatchResult[],
      suffixBuilder?: (job: ImageBatchJob<TOptions>) => string | undefined,
    ): ImageBatchResult[] => {
      const jobById = new Map<string, ImageBatchJob<TOptions>>();
      for (const normalized of normalizedJobs) {
        jobById.set(normalized.id, normalized.job);
      }

      return results.map((result) => {
        const job = jobById.get(result.id);
        if (!job) {
          return {
            id: result.id,
            status: "error",
            file: new File([], "unknown"),
            error: "Unknown batch result",
          } as ImageBatchFailure;
        }

        if (result.status === "error") {
          return {
            id: result.id,
            status: "error",
            file: job.file,
            error: result.error,
          } satisfies ImageBatchFailure;
        }

        return {
          id: result.id,
          status: "success",
          file: job.file,
          blob: toBlob(result.buffer, result.mime),
          outputFileName:
            job.outputFileName ??
            buildOutputFileName(job.file, job.options.format, suffixBuilder?.(job)),
        } satisfies ImageBatchSuccess;
      });
    };

    const batchConvert = async (jobs: Array<ImageBatchJob<ConvertImageOptions>>) => {
      const normalizedJobs = normalizeBatchJobs(jobs);
      const results = await callWithBatchInputs(normalizedJobs, (worker, workerJobs) =>
        worker.batchConvert(workerJobs),
      );
      return mapBatchResults(normalizedJobs, results);
    };

    const batchCompress = async (jobs: Array<ImageBatchJob<CompressImageOptions>>) => {
      const normalizedJobs = normalizeBatchJobs(jobs);
      const results = await callWithBatchInputs(normalizedJobs, (worker, workerJobs) =>
        worker.batchCompress(workerJobs),
      );
      return mapBatchResults(normalizedJobs, results, () => "compressed");
    };

    const batchResize = async (jobs: Array<ImageBatchJob<ResizeImageOptions>>) => {
      const normalizedJobs = normalizeBatchJobs(jobs);
      const results = await callWithBatchInputs(normalizedJobs, (worker, workerJobs) =>
        worker.batchResize(workerJobs),
      );
      return mapBatchResults(
        normalizedJobs,
        results,
        (job) => `${job.options.width}x${job.options.height}`,
      );
    };

    const batchWatermarkText = async (
      jobs: Array<ImageBatchJob<WatermarkTextOptions>>,
    ) => {
      const normalizedJobs = normalizeBatchJobs(jobs);
      const results = await callWithBatchInputs(normalizedJobs, (worker, workerJobs) =>
        worker.batchWatermarkText(workerJobs),
      );
      return mapBatchResults(normalizedJobs, results, () => "watermarked");
    };

    return {
      getEncodeSupport,
      readDimensions,
      convert,
      compress,
      resize,
      crop,
      watermarkText,
      batchConvert,
      batchCompress,
      batchResize,
      batchWatermarkText,
      fitWithinBox,
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    getWorker()
      .then((worker) => {
        if (mounted) setIsLoaded(true);
        return worker.warmup();
      })
      .catch((error) => {
        console.error("Failed to initialize image worker:", error);
        if (mounted) {
          // Let users proceed; operations can still attempt lazy codec init.
          setIsLoaded(true);
        }
      });

    return () => {
      mounted = false;
      resetWorker();
    };
  }, []);

  return [isLoaded, operations] as const;
}
