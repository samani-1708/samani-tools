"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  ArrowLeftRight,
  Check,
  Download,
  Settings,
  X,
} from "lucide-react";
import { useDiffStore } from "../store";
import { SUPPORTED_LANGUAGES } from "../types";
import type { FileType, Precision, ViewMode } from "../types";
import { downloadMergedText } from "../lib/merge-utils";

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center rounded-md border border-border overflow-hidden">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "px-3 py-1.5 text-xs font-medium transition-colors",
            value === opt.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function Toolbar() {
  const {
    fileType,
    setFileType,
    viewMode,
    setViewMode,
    precision,
    setPrecision,
    syntaxLang,
    setSyntaxLang,
    hasDiffed,
    computing,
    computeDiff,
    swapSides,
    acceptAll,
    rejectAll,
    getMergedText,
    settingsOpen,
    setSettingsOpen,
    editInputs,
  } = useDiffStore();

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-border bg-muted/50">
      <SegmentedControl<FileType>
        options={[
          { value: "text", label: "Text" },
          { value: "image", label: "Image" },
        ]}
        value={fileType}
        onChange={setFileType}
      />

      {fileType === "text" && (
        <>
          <Button onClick={hasDiffed ? editInputs : computeDiff} disabled={computing}>
            {computing ? "Computing..." : hasDiffed ? "Edit Inputs" : "Find Differences"}
          </Button>

          <Button variant="outline" size="icon" onClick={swapSides}>
            <ArrowLeftRight className="h-4 w-4" />
          </Button>

          <SegmentedControl<ViewMode>
            options={[
              { value: "split", label: "Split" },
              { value: "unified", label: "Unified" },
            ]}
            value={viewMode}
            onChange={setViewMode}
          />

          <SegmentedControl<Precision>
            options={[
              { value: "line", label: "Line" },
              { value: "word", label: "Word" },
              { value: "char", label: "Char" },
            ]}
            value={precision}
            onChange={setPrecision}
          />

          <Select value={syntaxLang} onValueChange={setSyntaxLang}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasDiffed && (
            <div className="flex items-center gap-1 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={acceptAll}
                className="text-xs gap-1"
              >
                <Check className="h-3 w-3" /> Accept All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={rejectAll}
                className="text-xs gap-1"
              >
                <X className="h-3 w-3" /> Reject All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadMergedText(getMergedText())}
                className="text-xs gap-1"
              >
                <Download className="h-3 w-3" /> Download
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSettingsOpen(!settingsOpen)}
            className={cn(
              hasDiffed ? "" : "ml-auto",
              settingsOpen && "bg-muted"
            )}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </>
      )}

      {fileType !== "text" && (
        <Button variant="outline" size="icon" onClick={swapSides}>
          <ArrowLeftRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
