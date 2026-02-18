"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  ArrowLeftRight,
  Check,
  Download,
  Pencil,
  Settings,
  X,
} from "lucide-react";
import { useDiffStore } from "../store";
import type { FileType } from "../types";
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
    <div className="inline-flex items-center rounded-md border border-border overflow-hidden h-8">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "px-2.5 h-full text-xs font-medium transition-colors whitespace-nowrap",
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

function ToolbarButton({
  onClick,
  disabled,
  icon: Icon,
  label,
  tooltip,
  variant = "outline",
  active,
}: {
  onClick: () => void;
  disabled?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  label?: string;
  tooltip?: string;
  variant?: "outline" | "ghost" | "default";
  active?: boolean;
}) {
  const btn = (
    <Button
      variant={variant}
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={cn("h-8 text-xs gap-1.5", active && "bg-muted", !label && "px-2")}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label && <span className="hidden sm:inline">{label}</span>}
    </Button>
  );

  if (tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{btn}</TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    );
  }

  return btn;
}

export function Toolbar() {
  const {
    fileType,
    setFileType,
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
    leftFile,
    rightFile,
    setLeftFile,
    setRightFile,
  } = useDiffStore();

  const hasFiles = !!leftFile && !!rightFile;

  return (
    <div className="border-b border-border bg-muted/50">
      {/* Row 1: Primary controls — always visible */}
      <div className="flex flex-wrap items-center gap-1.5 px-3 py-2">
        <SegmentedControl<FileType>
          options={[
            { value: "text", label: "Text" },
            { value: "image", label: "Image" },
          ]}
          value={fileType}
          onChange={setFileType}
        />

        <div className="w-px h-5 bg-border mx-0.5 hidden sm:block" />

        {/* Text mode actions */}
        {fileType === "text" && (
          <>
            <Button
              size="sm"
              className="h-8 text-xs"
              onClick={hasDiffed ? editInputs : computeDiff}
              disabled={computing}
            >
              {computing ? "..." : hasDiffed ? (
                <><Pencil className="h-3.5 w-3.5 sm:mr-1.5" /><span className="hidden sm:inline">Edit</span></>
              ) : (
                <><span className="sm:hidden">Diff</span><span className="hidden sm:inline">Find Differences</span></>
              )}
            </Button>

            <ToolbarButton
              onClick={swapSides}
              icon={ArrowLeftRight}
              tooltip="Swap sides"
            />
          </>
        )}

        {/* Image mode actions */}
        {fileType === "image" && hasFiles && (
          <>
            <ToolbarButton
              onClick={() => { setLeftFile(null); setRightFile(null); }}
              icon={Pencil}
              label="Change"
              tooltip="Change images"
            />
            <ToolbarButton
              onClick={swapSides}
              icon={ArrowLeftRight}
              tooltip="Swap sides"
            />
          </>
        )}

        {/* Right-aligned: merge controls (text diffed) + settings */}
        <div className="ml-auto flex items-center gap-1.5">
          {fileType === "text" && hasDiffed && (
            <>
              <ToolbarButton
                onClick={acceptAll}
                icon={Check}
                label="Accept All"
                tooltip="Accept all changes"
              />
              <ToolbarButton
                onClick={rejectAll}
                icon={X}
                label="Reject All"
                tooltip="Reject all changes"
              />
              <ToolbarButton
                onClick={() => downloadMergedText(getMergedText())}
                icon={Download}
                tooltip="Download merged result"
              />
            </>
          )}

          {fileType === "text" && (
            <ToolbarButton
              onClick={() => setSettingsOpen(!settingsOpen)}
              icon={Settings}
              tooltip="Settings"
              variant="ghost"
              active={settingsOpen}
            />
          )}
        </div>
      </div>

    </div>
  );
}
