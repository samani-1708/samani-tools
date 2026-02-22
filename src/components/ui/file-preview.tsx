"use client";

import { FileTextIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FilePreview({
  file,
  onRemove,
}: {
  file: File;
  onRemove?: () => void;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs max-w-60">
      <FileTextIcon className="h-3.5 w-3.5 shrink-0 text-primary" />
      <span className="truncate">{file.name}</span>
      {onRemove ? (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-5 w-5 shrink-0"
          onClick={onRemove}
          aria-label="Remove file"
        >
          <XIcon className="h-3 w-3" />
        </Button>
      ) : null}
    </div>
  );
}
