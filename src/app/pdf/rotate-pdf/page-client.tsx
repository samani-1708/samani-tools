"use client";

import { FileUploaded, useFileUpload } from "@/app/common/hooks";
import { PDFStatePending } from "@/app/common/pdf-viewer/pdf-states";
import { Button } from "@/components/ui/button";
import { Loader2Icon, RotateCcwIcon, RotateCwIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { usePDFUtils } from "../common/use-pdf-utils.hooks";
import { downloadLink } from "@/app/common/utils";
import { PDFToolLayout } from "../common/layouts/pdf-tool-layout";
import { ProcessingButton } from "../common/layouts/processing-button";

const ViewPDF = dynamic(() => import("@/app/common/pdf-viewer/pdf-viewer"), {
  ssr: false,
  loading: () => <PDFStatePending header="Loading" subHeader="" />,
});

type RotationDirection = "left" | "right";

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [totalPages, setTotalPages] = useState(-1);
  const [currentPage, setCurrentPage] = useState(0);
  const [rotations, setRotations] = useState<number[]>([]);

  const fileUploaded: FileUploaded | null = files?.[0] || null;

  // Load page count when file is uploaded
  useEffect(() => {
    if (isLoaded && fileUploaded?.file && totalPages === -1) {
      async function countPages() {
        const buffer = await fileUploaded!.file.arrayBuffer();
        const pagesCount = await utils.getTotalPages({ id: "123", buffer });
        setTotalPages(pagesCount);
        setRotations(new Array(pagesCount).fill(0));
      }
      countPages().catch((e) => console.error(e));
    }
  }, [fileUploaded, isLoaded, totalPages]);

  function handleRotate(direction: RotationDirection) {
    const delta = direction === "right" ? 90 : -90;
    setRotations((prev) => {
      const newRotations = [...prev];
      newRotations[currentPage] = (newRotations[currentPage] + delta + 360) % 360;
      return newRotations;
    });
  }

  function handleRotateAll(direction: RotationDirection) {
    const delta = direction === "right" ? 90 : -90;
    setRotations((prev) =>
      prev.map((r) => (r + delta + 360) % 360)
    );
  }

  async function handleApplyRotation() {
    if (!fileUploaded || isProcessing) return;

    // Check if any page has rotation
    const hasRotation = rotations.some((r) => r !== 0);
    if (!hasRotation) {
      toast.info("No pages have been rotated");
      return;
    }

    setIsProcessing(true);

    try {
      const buffer = await fileUploaded.file.arrayBuffer();

      // Process each page that has rotation
      let resultBytes: Uint8Array = new Uint8Array(buffer);

      for (let i = 0; i < rotations.length; i++) {
        if (rotations[i] !== 0) {
          resultBytes = await utils.rotate(resultBytes.buffer.slice(0) as ArrayBuffer, {
            rotation: rotations[i],
            pages: [i],
          });
        }
      }

      const blob = new Blob([resultBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      downloadLink(url, `rotated-${fileUploaded.name}`);

      toast.success("PDF rotated successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to rotate PDF");
    } finally {
      setIsProcessing(false);
    }
  }

  function handleReset() {
    resetInput();
    setTotalPages(-1);
    setCurrentPage(0);
    setRotations([]);
  }

  return (
    <PDFToolLayout
      showUpload={files.length === 0}
      uploadProps={{
        title: "Upload PDF File",
        subtitle: "Click to select a PDF to rotate",
        label: "Upload PDF",
        fileInputRef,
        handleFileUpload,
        triggerFileInput,
      }}
      sidebarTitle="Rotate PDF"
      content={
        <div className="flex flex-col items-center gap-4">
          {totalPages >= 1 ? (
            <>
              {/* Page navigation */}
              <div className="flex items-center gap-4 mb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage === totalPages - 1}
                >
                  Next
                </Button>
              </div>

              {/* Current page preview */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div
                  className="aspect-[3/4] bg-gray-100 dark:bg-gray-800 rounded overflow-hidden mb-3 transition-transform duration-300 w-full max-w-[300px]"
                  style={{
                    transform: `rotate(${rotations[currentPage] || 0}deg)`,
                  }}
                >
                  <ViewPDF
                    src={fileUploaded!.file}
                    range={[currentPage]}
                    width={300}
                    forceRefresh
                    defaultOverrides={{
                      pageBetweenMargin: "0px",
                      pageBoxShadow: "none",
                    }}
                  />
                </div>
                <p className="text-sm text-center text-gray-700 dark:text-gray-300">
                  Rotation: {rotations[currentPage] || 0}°
                </p>
              </div>
            </>
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
            <p>Total pages: {totalPages > 0 ? totalPages : "Loading..."}</p>
          </div>

          {/* Rotation controls */}
          <div className="flex-1 space-y-6">
            {/* Current page rotation */}
            <div>
              <h3 className="text-sm font-medium mb-3">Rotate Current Page</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleRotate("left")}
                  className="flex-1"
                >
                  <RotateCcwIcon className="w-4 h-4 mr-2" />
                  Left 90°
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleRotate("right")}
                  className="flex-1"
                >
                  <RotateCwIcon className="w-4 h-4 mr-2" />
                  Right 90°
                </Button>
              </div>
            </div>

            {/* All pages rotation */}
            <div>
              <h3 className="text-sm font-medium mb-3">Rotate All Pages</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleRotateAll("left")}
                  className="flex-1"
                >
                  <RotateCcwIcon className="w-4 h-4 mr-2" />
                  All Left
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleRotateAll("right")}
                  className="flex-1"
                >
                  <RotateCwIcon className="w-4 h-4 mr-2" />
                  All Right
                </Button>
              </div>
            </div>

            {/* Quick actions */}
            <div>
              <h3 className="text-sm font-medium mb-3">Quick Actions</h3>
              <div className="flex flex-wrap gap-2">
                {[90, 180, 270].map((deg) => (
                  <Button
                    key={deg}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRotations((prev) => {
                        const newRotations = [...prev];
                        newRotations[currentPage] = deg;
                        return newRotations;
                      });
                    }}
                  >
                    {deg}°
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRotations((prev) => {
                      const newRotations = [...prev];
                      newRotations[currentPage] = 0;
                      return newRotations;
                    });
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>

            {/* Reset all */}
            <Button
              variant="outline"
              onClick={() => setRotations(new Array(totalPages).fill(0))}
              className="w-full"
            >
              Reset All Rotations
            </Button>
          </div>
        </>
      }
      actions={
        <ProcessingButton
          onClick={handleApplyRotation}
          disabled={totalPages <= 0}
          isProcessing={isProcessing}
          label="Rotate PDF"
          processingLabel="Rotating..."
        />
      }
    />
  );
}
