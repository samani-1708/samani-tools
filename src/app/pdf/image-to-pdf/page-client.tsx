"use client";

import {
  fileListManagerUtils,
  FileUploaded,
  useFileUpload
} from "@/app/common/hooks";

import {
  createPDFBlobURL,
  downloadLink,
  filterPdfEmbedableImages,
} from "@/app/common/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  DownloadIcon,
  PlusIcon,
  RotateCcwIcon,
  TrashIcon
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ImageInput, Margin, PageSize } from "../common/types";
import { usePDFUtils } from "../common/use-pdf-utils.hooks";
import { PDFToolLayout } from "../common/layouts/pdf-tool-layout";
import { ProcessingButton } from "../common/layouts/processing-button";

const PAGE_SIZE_LABELS: Record<PageSize, string> = {
  a4: "A4 (210 × 297 mm)",
  natural: "Natural (Image size)",
  "us-letter": "US Letter (215 × 279 mm)",
};

const MARGIN_LABELS: Record<Margin, string> = {
  none: "No margin",
  small: "Small margin",
  large: "Large margin",
};

export function PageClient() {
  const { files, setFiles, fileInputRef, handleFileUpload, triggerFileInput } =
    useFileUpload(filterPdfEmbedableImages);

  const [pageSize, setPageSize] = useState<PageSize>("a4");
  const [margin, setMargin] = useState<Margin>("small");

  const [isConverting, setIsConverting] = useState(false);
  const [result, setResult] = useState<{ url: string; filename: string } | null>(null);

  const [isLoaded, pdfUtils] = usePDFUtils();

  const { moveFileDown, moveFileUp, deleteFile } = fileListManagerUtils(
    "--invalid-",
    files.map((file) => ({ ...file, pages: [] })),
  );

  const canConvert = !isConverting && files.length > 0 && isLoaded;

  const handleConvert = async () => {
    if (!canConvert) return;

    setIsConverting(true);

    try {
      const imagesBufferPromises = files.map((file) => file.file.arrayBuffer());
      const imagesBuffer = await Promise.all(imagesBufferPromises);

      const images: ImageInput[] = files.map((image: FileUploaded, index) => ({
        buffer: imagesBuffer[index],
        type: image.type as "image/png" | "image/jpeg",
      }));

      const buffer = await pdfUtils.embedImages(images, {
        orientation: "portrait",
        pageSize,
        margin,
      });

      const url = createPDFBlobURL(buffer);
      setResult({ url, filename: "images-to-pdf.pdf" });
    } catch (error) {
      console.error("Error converting images to PDF:", error);
    } finally {
      setIsConverting(false);
    }
  };

  function handleDownload() {
    if (!result) return;
    downloadLink(result.url, result.filename);
  }

  function handleReset() {
    if (result?.url) URL.revokeObjectURL(result.url);
    setResult(null);
    setFiles([]);
  }

  useEffect(() => {
    return () => {
      if (result?.url) URL.revokeObjectURL(result.url);
    };
  }, [result?.url]);

  useEffect(() => {
    if (!result?.url) return;
    URL.revokeObjectURL(result.url);
    setResult(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize, margin, files.map((f) => f.id).join("|")]);

  return (
    <PDFToolLayout
      showUpload={files.length === 0}
      uploadProps={{
        multiple: true,
        accept: "image/*",
        title: "Upload Images",
        subtitle: "Click to select JPG or PNG images",
        label: "Upload Images",
        fileInputRef,
        handleFileUpload,
        triggerFileInput,
      }}
      sidebarTitle="Image to PDF"
      content={
        <div className="flex flex-wrap gap-6 justify-center">
          {files.map((file, index) => {
            const isFirst = index === 0;
            const isLast = index === files.length - 1;

            return (
              <div
                key={file.id}
                className="group relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 w-36 sm:w-48 hover:shadow-lg transition-shadow"
              >
                {/* Image thumbnail */}
                <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-800 rounded overflow-hidden mb-2 relative">
                  <Image
                    src={file.afterEditUrl || file.url}
                    alt={file.name}
                    fill
                    className="object-contain"
                  />
                </div>

                {/* File name */}
                <p className="text-xs text-center truncate text-gray-700 dark:text-gray-300">
                  {file.name}
                </p>

                {/* Action buttons - visible on hover */}
                <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!isFirst && (
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-7 w-7"
                      onClick={() => setFiles(moveFileUp(file.id))}
                    >
                      <ArrowUpIcon className="w-3 h-3" />
                    </Button>
                  )}
                  {!isLast && (
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-7 w-7"
                      onClick={() => setFiles(moveFileDown(file.id))}
                    >
                      <ArrowDownIcon className="w-3 h-3" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-7 w-7"
                    onClick={() => setFiles(deleteFile(file.id))}
                  >
                    <TrashIcon className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            );
          })}

          {/* Add more button */}
          <div
            onClick={triggerFileInput}
            className="relative bg-white dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3 w-36 sm:w-48 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors aspect-[3/4]"
          >
            <Button className="w-12 h-12 rounded-full flex items-center justify-center mb-2">
              <PlusIcon className="w-6 h-6" />
            </Button>
            <span className="text-sm">Add more</span>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>
      }
      controls={
        <>
          {/* Page Size */}
          <div className="mb-6">
            <Label className="text-sm font-medium mb-3 block">Page Size</Label>
            <RadioGroup
              value={pageSize}
              onValueChange={(v) => setPageSize(v as PageSize)}
              className="space-y-2"
            >
              {(Object.keys(PAGE_SIZE_LABELS) as PageSize[]).map((size) => (
                <div
                  key={size}
                  className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                  onClick={() => setPageSize(size)}
                >
                  <RadioGroupItem value={size} id={`size-${size}`} />
                  <Label
                    htmlFor={`size-${size}`}
                    className="cursor-pointer flex-1"
                  >
                    {PAGE_SIZE_LABELS[size]}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Margins */}
          <div className="mb-6">
            <Label className="text-sm font-medium mb-3 block">Margins</Label>
            <RadioGroup
              value={margin}
              onValueChange={(v) => setMargin(v as Margin)}
              className="space-y-2"
            >
              {(Object.keys(MARGIN_LABELS) as Margin[]).map((m) => (
                <div
                  key={m}
                  className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                  onClick={() => setMargin(m)}
                >
                  <RadioGroupItem value={m} id={`margin-${m}`} />
                  <Label
                    htmlFor={`margin-${m}`}
                    className="cursor-pointer flex-1"
                  >
                    {MARGIN_LABELS[m]}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="flex-1" />
        </>
      }
      actions={
        result ? (
          <Button onClick={handleDownload} className="w-full h-10 sm:h-12 text-sm sm:text-base font-semibold" aria-label="Download PDF">
            <DownloadIcon className="w-5 h-5 sm:mr-2" />
            <span className="hidden sm:inline">Download</span>
          </Button>
        ) : (
          <ProcessingButton
            onClick={handleConvert}
            disabled={!canConvert}
            isProcessing={isConverting}
            label="Convert to PDF"
            processingLabel="Converting..."
          />
        )
      }
      secondaryActions={
        <Button variant="outline" onClick={handleReset} className="w-full" aria-label="Start over">
          <RotateCcwIcon className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Start Over</span>
        </Button>
      }
    />
  );
}
