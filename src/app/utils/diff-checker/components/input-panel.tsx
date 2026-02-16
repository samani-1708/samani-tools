"use client";

import { useCallback } from "react";
import { Upload } from "lucide-react";
import { useDiffStore } from "../store";

function FileDropZone({
  label,
  file,
  onFile,
  accept,
}: {
  label: string;
  file: File | null;
  onFile: (f: File | null) => void;
  accept: string;
}) {
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer.files[0];
      if (f) onFile(f);
    },
    [onFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) onFile(f);
    },
    [onFile]
  );

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border bg-muted/40">
        {label}
      </div>
      <label
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="flex-1 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/30 transition-colors p-8"
      >
        <Upload className="h-8 w-8 text-muted-foreground" />
        {file ? (
          <span className="text-sm font-medium">{file.name}</span>
        ) : (
          <span className="text-sm text-muted-foreground">
            Drop file here or click to browse
          </span>
        )}
        <input
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />
      </label>
    </div>
  );
}

export function InputPanel() {
  const {
    leftText,
    rightText,
    setLeftText,
    setRightText,
    fileType,
    leftFile,
    rightFile,
    setLeftFile,
    setRightFile,
  } = useDiffStore();

  if (fileType !== "text") {
    const accept = "image/*";
    return (
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border overflow-hidden">
        <FileDropZone
          label="Current"
          file={leftFile}
          onFile={setLeftFile}
          accept={accept}
        />
        <FileDropZone
          label="Incoming"
          file={rightFile}
          onFile={setRightFile}
          accept={accept}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border overflow-hidden">
      <div className="flex flex-col h-full">
        <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border bg-muted/40">
          Current
        </div>
        <textarea
          value={leftText}
          onChange={(e) => setLeftText(e.target.value)}
          placeholder="Paste current text here..."
          className="flex-1 w-full resize-none bg-transparent p-4 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
          spellCheck={false}
        />
      </div>
      <div className="flex flex-col h-full">
        <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border bg-muted/40">
          Incoming
        </div>
        <textarea
          value={rightText}
          onChange={(e) => setRightText(e.target.value)}
          placeholder="Paste incoming text here..."
          className="flex-1 w-full resize-none bg-transparent p-4 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
