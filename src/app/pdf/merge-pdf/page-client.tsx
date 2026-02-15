"use client";

import {
  fileListManagerUtils,
  FileUploaded,
  useFileUpload,
} from "@/app/common/hooks";
import { PDFStatePending } from "@/app/common/pdf-viewer/pdf-states";
import {
  createPDFBlobURL,
  downloadLink,
} from "@/app/common/utils";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Mover, PrintPage } from "../common/ui";
import { fakeTransformFileWithPages, usePDFUtils } from "../common/use-pdf-utils.hooks";
import { toast } from "sonner";
import { PDFToolLayout } from "../common/layouts/pdf-tool-layout";
import { ProcessingButton } from "../common/layouts/processing-button";

const ViewPDF = dynamic(() => import("@/app/common/pdf-viewer/pdf-viewer"), {
  ssr: false,
  loading: () => <PDFStatePending header="Loading" subHeader="" />,
});

export function PageClient() {
  // collect the input files
  const { files, fileInputRef, handleFileUpload, triggerFileInput, setFiles } =
    useFileUpload((f) =>
      Array.from(f).filter((file) => file.type === "application/pdf"),
    );

  const [selectedFileId] = useState<string>('--invalid-selected-file--');

  const fileWithPages = fakeTransformFileWithPages(files);

  const { deleteFile, moveFileUp, moveFileDown } = fileListManagerUtils(selectedFileId , fileWithPages);
  const [isMerging, setIsMerging] = useState(false);

  const [isLoaded, { merge }] = usePDFUtils();

  const canMerge = files.length >= 2 && !isMerging && isLoaded;

  console.log("canMerge", canMerge, files.length, isMerging, isLoaded);

  const handleMerge = async () => {
    if (!canMerge) return;

    setIsMerging(true);

    try {
      const fileNativeObjects = files;

      const mergedBytes = await merge(fileNativeObjects);

      const url = createPDFBlobURL(mergedBytes);
      downloadLink(url, "merged.pdf");
      URL.revokeObjectURL(url);
    } catch (error ) {
      console.error("Failed to merge PDFs:", error);
      toast.error((error as Error)?.message || "Failed to merge PDFs")
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <PDFToolLayout
      showUpload={files.length === 0}
      uploadProps={{
        multiple: true,
        title: "Upload PDF Files",
        subtitle: "Click to select multiple PDFs to merge",
        label: "Upload PDFs",
        fileInputRef,
        handleFileUpload,
        triggerFileInput,
      }}
      sidebarTitle="Merge PDF"
      sidebarWidth="sm"
      disabled={isMerging}
      content={
        <div className="flex flex-wrap gap-6 justify-center">
          {files.map((fileState, index) => {
            const { file: fileNative, name } = fileState;
            const isFirst = index === 0;
            const isLast = index === files.length - 1;

            return (
              <PrintPage.Layout key={fileState.id} pageId={fileState.id}>
                {/* PDF thumbnail */}
                <PrintPage.Thumbnail>
                  <ViewPDF src={fileNative} range={[0]} width={180} forceRefresh defaultOverrides={{
                    pageBetweenMargin: "0px",
                    pageBoxShadow: "none",
                  }} />
                </PrintPage.Thumbnail>

                {/* File name */}
                <PrintPage.Name>{name}</PrintPage.Name>

                {/* Action buttons */}
                <PrintPage.Actions disabled={false} alwaysVisible>
                  <Mover
                    orientation="horizontal"
                    showUp={!isFirst}
                    showDown={!isLast}
                    showDelete={true}
                    onMoveUp={() => setFiles(moveFileUp(fileState.id))}
                    onMoveDown={() => setFiles(moveFileDown(fileState.id))}
                    onDelete={() => setFiles(deleteFile(fileState.id))}
                  />
                </PrintPage.Actions>
              </PrintPage.Layout>
            );
          })}

          {/* Add more button */}
          <PrintPage.AddMorePage
            onAddMore={triggerFileInput}
            fileInputRef={fileInputRef as any}
            onFileChange={handleFileUpload}
          />
        </div>
      }
      controls={
        <>
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              To change the order of your PDFs, use the arrow buttons on each file
              card.
            </p>
          </div>

          <div className="flex-1" />

          {files.length < 2 && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Add at least 2 PDFs to merge
            </p>
          )}
        </>
      }
      actions={
        <ProcessingButton
          onClick={handleMerge}
          disabled={!canMerge}
          isProcessing={isMerging}
          label="Merge PDF"
          processingLabel="Merging..."
        />
      }
    />
  );
}
