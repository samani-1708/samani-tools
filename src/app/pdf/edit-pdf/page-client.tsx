"use client";

import { useFileUpload } from "@/app/common/hooks";
import { UploadButtonFull } from "@/app/common/upload";
import { Button } from "@/components/ui/button";
import { RotateCcwIcon } from "lucide-react";

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

  const fileUploaded = files[0] ?? null;

  // useFileUpload already creates a blob URL at fileUploaded.url —
  // just pass it straight to the viewer. No extra URL.createObjectURL needed.
  const viewerUrl = fileUploaded
    ? `/pdfjs-viewer/web/viewer.html?file=${encodeURIComponent(fileUploaded.url)}`
    : null;

  const handleReset = () => {
    resetInput();
  };

  if (!fileUploaded) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <UploadButtonFull
          multiple={false}
          accept="application/pdf"
          title="Upload PDF to Edit"
          subtitle="Click to select a PDF file to annotate, draw on, or highlight"
          label="Upload PDF"
          fileInputRef={fileInputRef}
          handleFileUpload={handleFileUpload}
          triggerFileInput={triggerFileInput}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <p className="text-sm text-muted-foreground truncate max-w-[60%]" title={fileUploaded.name}>
          {fileUploaded.name}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="flex-shrink-0"
        >
          <RotateCcwIcon className="w-4 h-4 mr-1.5" />
          Upload New
        </Button>
      </div>
      <iframe
        src={viewerUrl ?? undefined}
        className="flex-1 w-full border-0"
        title="PDF Editor"
      />
    </div>
  );
}
