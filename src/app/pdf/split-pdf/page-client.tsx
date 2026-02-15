"use client";

import {
  FileUploaded,
  useFileUpload,
  useZip,
} from "@/app/common/hooks";
import { PDFStatePending } from "@/app/common/pdf-viewer/pdf-states";
import { Loader2Icon } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { usePDFUtils } from "../common/use-pdf-utils.hooks";
import { Controls } from "./controls";
import { SplitModes } from "./utils";
import { FileObject } from "../common/types";
import { PDFToolLayout } from "../common/layouts/pdf-tool-layout";
import { ProcessingButton } from "../common/layouts/processing-button";

const ViewPDF = dynamic(() => import("@/app/common/pdf-viewer/pdf-viewer"), {
  ssr: false,
  loading: () => <PDFStatePending header="Loading" subHeader="" />,
});

function canSplit(
  isProcessing: boolean,
  fileUploaded: FileUploaded | null,
  totalPages: number,
) {
  if (isProcessing) {
    return {
      can: false,
      message: "Spliting PDF is already in progress",
    };
  }

  if (!fileUploaded || totalPages <= 0) {
    return {
      can: false,
      message: "No pages available to split",
    };
  }

  return {
    can: true,
  };
}

function getRanges(mode: SplitModes, ranges: number[][], totalPages = 1) {
  let processRanges = ranges;

  processRanges = processRanges.filter((range) => range.length > 0);

  if (processRanges.length === 0 && totalPages > 0) {
    processRanges = [[0, 1]];
  }

  if (processRanges.length > 0) {
    if (mode === "RANGE") {
      processRanges = processRanges.map((range) => {
        const [start, end] = range;
        const rangePages: number[] = [];

        for (let i = start; i <= end; i++) {
          if (i >= 0 && i <= totalPages - 1) {
            rangePages.push(i);
          }
        }

        return rangePages;
      });
    } else if (mode === "N_PER_PAGE") {
      processRanges = processRanges.map((range) => {
        const [start, end] = range;
        const rangePages: number[] = [];

        for (let i = start; i <= end; i++) {
          if (i >= 0 && i <= totalPages - 1) {
            rangePages.push(i);
          }
        }
        return rangePages;
      });
    }
  }

  console.log("debug::", {processRanges})

  return processRanges;
}

export function PageClient() {
  const {
    files,
    fileInputRef,
    handleFileUpload,
    triggerFileInput,
    resetInput,
  } = useFileUpload((f) =>
    Array.from(f).filter((file) => file.type === "application/pdf"),
  );

  const [isLoaded, utils] = usePDFUtils();
  const [isLibLoaded, zipUtils] = useZip();
  const [isSplitting, setIsSplitting] = useState(false);

  const [totalPages, setTotalPages] = useState(-1);

  const fileUploaded: FileUploaded | null = files?.[0] || null;

  const [ranges, setRanges] = useState<number[][]>([]);
  const [mode, setMode] = useState<SplitModes>("RANGE");

  async function handleApplySplit() {
    const { can, message } = canSplit(isSplitting, fileUploaded, totalPages);

    if (!can) {
      return toast.info(message);
    }

    const processRanges = getRanges(mode, ranges, totalPages);

    if (!processRanges || processRanges?.length === 0) {
      toast.error("Page range is incorrect");
      return;
    }

    setIsSplitting(true);

    try {
      const buffer = await fileUploaded!.file.arrayBuffer();

      const fileObject: FileObject = {
        id: fileUploaded!.id,
        buffer: buffer,
      };

      const splitPromise = await utils.split(fileObject, processRanges);

      if (splitPromise.length === 0) {
        toast.error("Something went wrong");
        return;
      }

      const zipBlob = await zipUtils.zip(
        splitPromise.map((buffer, i) => ({
          name: `split_${i}_file.pdf`,
          buffer: buffer,
        })),
      );

      const zipUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = zipUrl;
      link.download = `split-pdfs-${Date.now()}.zip`;
      link.click();

      toast.success("Done!");
    } catch (error) {
      console.error(error);
      toast.error("Unable to split");
    } finally {
      handleReset();
      setIsSplitting(false);
    }
  }

  function handleReset() {
    resetInput();
    resetPageRanges();
  }

  function resetPageRanges() {
    setRanges([]);
    setMode("RANGE");
  }

  console.log("debug::", ranges);

  useEffect(() => {
    if (isLoaded && fileUploaded?.file && totalPages === -1) {
      async function countPages() {
        const buffer = await fileUploaded!.file.arrayBuffer();
        const pagesCount = await utils.getTotalPages({ id: "123", buffer });
        setRanges([[0, pagesCount - 1]]);
        setTotalPages(pagesCount);
      }

      countPages().catch((e) => console.error(e));
    }
  }, [fileUploaded, isLoaded, totalPages]);

  console.log("aniket::: totalPages", totalPages);

  return (
    <PDFToolLayout
      showUpload={files.length === 0}
      uploadProps={{
        title: "Upload PDF File",
        subtitle: "Click to select a PDF to split",
        label: "Upload PDF",
        fileInputRef,
        handleFileUpload,
        triggerFileInput,
      }}
      sidebarTitle="Split PDF"
      content={
        <div className="flex flex-wrap gap-6 justify-center items-start">
          {totalPages >= 1 && ranges.length > 0 ? (
            ranges.map((range, index) => {
              if (range.length === 0) return null;

              const firstPageIndex = range[0] ?? 0;
              const lastPageIndex = range[range.length - 1] ?? 0;
              const isSinglePage = firstPageIndex === lastPageIndex;
              const hasMiddlePages = lastPageIndex - firstPageIndex > 1;

              return (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <p className="text-xs text-muted-foreground mb-3 text-center">
                    Split {index + 1}
                  </p>
                  <div className="flex items-center gap-2">
                    {/* First page */}
                    <div className="w-32">
                      <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-800 rounded overflow-hidden mb-1">
                        <ViewPDF
                          src={fileUploaded!.file}
                          range={[firstPageIndex]}
                          width={120}
                          forceRefresh
                          defaultOverrides={{
                            pageBetweenMargin: "0px",
                            pageBoxShadow: "none",
                          }}
                        />
                      </div>
                      <p className="text-xs text-center text-muted-foreground">
                        Page {firstPageIndex + 1}
                      </p>
                    </div>

                    {/* Ellipsis for middle pages */}
                    {!isSinglePage && (
                      <>
                        <div className="flex flex-col items-center justify-center px-2">
                          <span className="text-2xl text-muted-foreground tracking-widest">
                            •••
                          </span>
                          {hasMiddlePages && (
                            <span className="text-xs text-muted-foreground mt-1">
                              + {lastPageIndex - firstPageIndex - 1} pages +
                            </span>
                          )}
                        </div>

                        {/* Last page */}
                        <div className="w-32">
                          <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-800 rounded overflow-hidden mb-1">
                            <ViewPDF
                              defaultOverrides={{
                                pageBetweenMargin: "0px",
                                pageBoxShadow: "none",
                              }}
                              src={fileUploaded!.file}
                              range={[lastPageIndex]}
                              width={120}
                              forceRefresh
                            />
                          </div>
                          <p className="text-xs text-center text-muted-foreground">
                            Page {lastPageIndex + 1}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-center text-gray-600 dark:text-gray-400 mt-2">
                    {isSinglePage
                      ? "1 page"
                      : `${lastPageIndex - firstPageIndex + 1} pages`}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 w-full max-w-[16rem]">
              <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-800 rounded overflow-hidden mb-3 flex items-center justify-center">
                <Loader2Icon className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
              <p className="text-sm text-center truncate text-gray-700 dark:text-gray-300">
                {fileUploaded?.name}
              </p>
            </div>
          )}
        </div>
      }
      controls={
        <>
          {/* File info */}
          <div className="text-sm text-muted-foreground mb-4">
            <p>Total pages: {totalPages}</p>
          </div>

          {/* Controls */}
          <div className="flex-1 space-y-6">
            {totalPages >= 1 && ranges.length > 0 && (
              <Controls
                resetPageRanges={resetPageRanges}
                setRanges={setRanges}
                setMode={setMode}
                fileState={fileUploaded}
                totalPages={totalPages}
                ranges={ranges}
                mode={mode}
              />
            )}
          </div>
        </>
      }
      actions={
        <ProcessingButton
          onClick={handleApplySplit}
          disabled={!canSplit(isSplitting, fileUploaded, totalPages).can}
          isProcessing={isSplitting}
          label="Split PDF"
          processingLabel="Splitting..."
        />
      }
    />
  );
}
