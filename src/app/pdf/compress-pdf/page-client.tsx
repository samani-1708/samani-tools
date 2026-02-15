"use client";

import { FileUploaded, useFileUpload } from "@/app/common/hooks";
import { PDFStatePending } from "@/app/common/pdf-viewer/pdf-states";
import { createPDFBlobURL, downloadLink } from "@/app/common/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRightIcon, Loader2Icon } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { usePDFUtils } from "../common/use-pdf-utils.hooks";
import { FileObject } from "../common/types";
import { PDFToolLayout } from "../common/layouts/pdf-tool-layout";
import { ProcessingButton } from "../common/layouts/processing-button";

const ViewPDF = dynamic(() => import("@/app/common/pdf-viewer/pdf-viewer"), {
  ssr: false,
  loading: () => <PDFStatePending header="Loading" subHeader="" />,
});

type CompressionMode = "relaxed" | "strict";

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionMode, setCompressionMode] = useState<CompressionMode>("relaxed");

  // Compression result state
  const [compressedResult, setCompressedResult] = useState<{
    url: string;
    size: number;
  } | null>(null);

  const fileUploaded: FileUploaded | null = files?.[0] || null;
  const originalSize = fileUploaded?.file?.size || 0;

  const canCompress = fileUploaded && !isCompressing && isLoaded;

  async function handleCompress() {
    if (!canCompress || !fileUploaded) return;

    setIsCompressing(true);
    setCompressedResult(null);

    try {
      const buffer = await fileUploaded.file.arrayBuffer();

      const fileObject: FileObject = {
        id: fileUploaded.id,
        buffer: buffer,
      };

      const compressedBytes = await utils.compress(fileObject, { mode: compressionMode,  });

      if (!compressedBytes) {
        throw new Error("Compression failed");
      }

      const url = createPDFBlobURL(compressedBytes);

      setCompressedResult({
        url,
        size: compressedBytes.length,
      });

      toast.success("PDF compressed successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Unable to compress PDF");
    } finally {
      setIsCompressing(false);
    }
  }

  function handleDownload() {
    if (compressedResult?.url) {
      const originalName = fileUploaded?.name || "document.pdf";
      const baseName = originalName.replace(/\.pdf$/i, "");
      downloadLink(compressedResult.url, `${baseName}-compressed.pdf`);
    }
  }

  function handleReset() {
    if (compressedResult?.url) {
      URL.revokeObjectURL(compressedResult.url);
    }
    setCompressedResult(null);
    resetInput();
  }

  // Cleanup URL on unmount
  useEffect(() => {
    return () => {
      if (compressedResult?.url) {
        URL.revokeObjectURL(compressedResult.url);
      }
    };
  }, [compressedResult?.url]);

  const compressionRatio = compressedResult && originalSize > 0
    ? (((originalSize - compressedResult.size) / originalSize) * 100).toFixed(1)
    : null;

  return (
    <PDFToolLayout
      showUpload={files.length === 0}
      uploadProps={{
        title: "Upload PDF File",
        subtitle: "Click to select a PDF to compress",
        label: "Upload PDF",
        fileInputRef,
        handleFileUpload,
        triggerFileInput,
      }}
      sidebarTitle="Compress PDF"
      sidebarWidth="sm"
      disabled={isCompressing}
      content={
        fileUploaded ? (
          <div className="flex flex-wrap gap-6 justify-center items-start">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 w-full max-w-[16rem]">
              <p className="text-xs text-muted-foreground mb-3 text-center">
                {compressedResult ? "Compressed Preview" : "Original File"}
              </p>
              <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-800 rounded overflow-hidden mb-3">
                <ViewPDF
                  src={compressedResult?.url || fileUploaded.file}
                  range={[0]}
                  width={240}
                  forceRefresh
                  defaultOverrides={{
                    pageBetweenMargin: "0px",
                    pageBoxShadow: "none",
                  }}
                />
              </div>
              <p className="text-sm text-center truncate text-gray-700 dark:text-gray-300">
                {fileUploaded.name}
              </p>
              <p className="text-xs text-center text-muted-foreground mt-1">
                {formatFileSize(compressedResult?.size || originalSize)}
              </p>
            </div>
          </div>
        ) : null
      }
      controls={
        <>
          {/* File info */}
          <div className="text-sm text-muted-foreground mb-4">
            <p>Original size: {formatFileSize(originalSize)}</p>
          </div>

          {/* Compression mode selector */}
          <div className="space-y-2 mb-6">
            <Label htmlFor="compression-mode">Compression Mode</Label>
            <Select
              disabled={isCompressing}
              value={compressionMode}
              onValueChange={(v) => setCompressionMode(v as CompressionMode)}
            >
              <SelectTrigger id="compression-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relaxed">Relaxed (Better Quality)</SelectItem>
                <SelectItem value="strict">Strict (Smaller Size)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Compression results */}
          {compressedResult && compressionRatio && (
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Original:</span>
                  <span>{formatFileSize(originalSize)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Compressed:</span>
                  <span>{formatFileSize(compressedResult.size)}</span>
                </div>
                <div className="flex justify-between font-medium pt-1 border-t border-green-200 dark:border-green-800 mt-2">
                  <span className="text-muted-foreground">Reduction:</span>
                  <span className="text-green-600 dark:text-green-400">
                    {Number(compressionRatio) > 0 ? `-${compressionRatio}%` : "No reduction"}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1" />

          {!isLoaded && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Loading compression tools...
            </p>
          )}
        </>
      }
      actions={
        compressedResult ? (
          <Button
            onClick={handleDownload}
            className="w-full h-10 sm:h-12 text-sm sm:text-base font-semibold"
          >
            Download Compressed PDF
            <ArrowRightIcon className="w-5 h-5 ml-2" />
          </Button>
        ) : (
          <ProcessingButton
            onClick={handleCompress}
            disabled={!canCompress}
            isProcessing={isCompressing}
            label="Compress PDF"
            processingLabel="Compressing..."
          />
        )
      }
      secondaryActions={
        compressedResult ? (
          <Button
            variant="outline"
            onClick={handleReset}
            className="w-full"
          >
            Compress Another PDF
          </Button>
        ) : undefined
      }
    />
  );
}
