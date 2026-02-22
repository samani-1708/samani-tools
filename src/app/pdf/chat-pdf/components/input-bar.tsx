"use client";

import { Button } from "@/components/ui/button";
import { FilePreview } from "@/components/ui/file-preview";
import { Textarea } from "@/components/ui/textarea";
import { Loader2Icon, PaperclipIcon, SendIcon, WrenchIcon } from "lucide-react";

// Bottom composer used by the chat window.
export function InputBar({
  value,
  onChange,
  onSubmit,
  onAttach,
  onTools,
  files,
  inputDisabled,
  sendDisabled,
  attachDisabled,
  isSending,
  ready,
  statusText,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onAttach: () => void;
  onTools: () => void;
  files?: File[];
  inputDisabled: boolean;
  sendDisabled: boolean;
  attachDisabled?: boolean;
  isSending: boolean;
  ready?: boolean;
  statusText?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-border p-2 shadow-sm ${ready ? "bg-white dark:bg-background" : "bg-muted/50"}`}
      onClick={(event) => {
        if (inputDisabled) return;
        const target = event.currentTarget.querySelector("textarea");
        if (target instanceof HTMLTextAreaElement) target.focus();
      }}
    >
      {files && files.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-2 max-h-20 overflow-auto">
          {files.map((file) => (
            <FilePreview key={`${file.name}-${file.size}-${file.lastModified}`} file={file} />
          ))}
        </div>
      ) : null}
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        placeholder="Ask about your PDFs..."
        className="w-full min-h-[92px] resize-none border-0 shadow-none focus-visible:ring-0 bg-transparent px-1"
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            if (!sendDisabled) onSubmit();
          }
        }}
        disabled={inputDisabled}
      />
      {!ready && statusText ? (
        <div className="text-[11px] text-muted-foreground px-1 pt-1">{statusText}</div>
      ) : null}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={onAttach}
            className="h-8 w-8"
            disabled={attachDisabled}
            aria-label="Attach PDF"
          >
            <PaperclipIcon className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={onTools}
            className="h-8 w-8"
            disabled={attachDisabled}
            aria-label="PDF tools"
          >
            <WrenchIcon className="w-4 h-4" />
          </Button>
        </div>
        <Button type="button" size="icon" onClick={onSubmit} disabled={sendDisabled}>
          {isSending ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <SendIcon className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
