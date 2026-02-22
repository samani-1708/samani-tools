"use client";

import { UploadButtonFull } from "@/app/common/upload";
import { useFileUpload } from "@/app/common/hooks";
import { filterImageFiles } from "@/app/image/common/filter-image-files";
import dynamic from "next/dynamic";
import { ImagePlus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import isPropValid from "@emotion/is-prop-valid";
import { StyleSheetManager } from "styled-components";
import { toast } from "sonner";
import { downloadBlob, getBaseName } from "../common/image-utils";
import "./filerobot-theme.css";

const FilerobotImageEditor = dynamic(
  () => import("react-filerobot-image-editor"),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
        Loading editor...
      </div>
    ),
  },
);

type SavedImageData = {
  imageBase64?: string;
  imageCanvas?: HTMLCanvasElement;
  extension?: string;
  fullName?: string;
  name?: string;
};

type EditorTheme = {
  palette: Record<string, string>;
  typography: {
    fontFamily: string;
  };
};

const DEFAULT_EDITOR_THEME: EditorTheme = {
  palette: {
    "bg-secondary": "#ffffff",
    "bg-primary": "#ffffff",
    "bg-primary-hover": "#f3f4f6",
    "bg-primary-active": "#f3f4f6",
    "accent-primary": "#111827",
    "accent-primary-hover": "#111827",
    "accent-primary-active": "#111827",
    "accent-stateless": "#111827",
    "accent-1-2-opacity": "rgba(17,24,39,0.12)",
    "accent-primary-disabled": "#cbd5e1",
    "icons-primary": "#111827",
    "icons-secondary": "#6b7280",
    "borders-secondary": "#e5e7eb",
    "borders-primary": "#d1d5db",
    "borders-strong": "#9ca3af",
    "borders-disabled": "#94a3b8",
    "borders-button": "#cbd5e1",
    "bg-hover": "#f1f5f9",
    "bg-active": "#e2e8f0",
    "link-stateless": "#334155",
    "link-hover": "#1f2937",
    "btn-primary-text": "#ffffff",
    "btn-primary-text-0-6": "rgba(255,255,255,0.6)",
    "btn-primary-text-0-4": "rgba(255,255,255,0.4)",
    "btn-disabled-text": "#94a3b8",
    "btn-secondary-text": "#111827",
    "light-shadow": "0 1px 2px rgba(0,0,0,0.12)",
    warning: "#ffffff",
    "warning-hover": "#ffffff",
    "warning-active": "#ffffff",
    error: "#ffffff",
    "error-hover": "#ffffff",
    "error-active": "#ffffff",
    "bg-red": "#ffffff",
    "bg-red-light": "#ffffff",
    "background-red-medium": "#ffffff",
    "borders-red": "#e5e7eb",
    "red-0-1-overlay": "rgba(255,255,255,0.1)",
  },
  typography: {
    fontFamily: "var(--font-geist-sans), Arial, sans-serif",
  },
};

function resolveToken(cssVarName: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const resolved = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue(cssVarName)
    .trim();
  return resolved || fallback;
}

async function toBlob(savedImageData: SavedImageData): Promise<Blob> {
  if (savedImageData.imageBase64) {
    const response = await fetch(savedImageData.imageBase64);
    return response.blob();
  }

  if (savedImageData.imageCanvas) {
    const canvasBlob = await new Promise<Blob | null>((resolve) => {
      savedImageData.imageCanvas?.toBlob((blob) => resolve(blob), "image/png", 0.92);
    });

    if (canvasBlob) return canvasBlob;
  }

  throw new Error("Editor did not return a valid image output");
}

export function PageClient() {
  // 1) Props
  // No props for this page component.

  // 2) State
  const [editorTheme, setEditorTheme] = useState<EditorTheme>(DEFAULT_EDITOR_THEME);
  const [hasEditorChanges, setHasEditorChanges] = useState(false);

  // 3) Custom hooks
  const { files, fileInputRef, handleFileUpload, triggerFileInput } = useFileUpload(filterImageFiles);

  // 4) Derived props and state
  const file = files[0]?.file;
  const defaultName = useMemo(() => {
    if (!file) return "edited-image";
    return `${getBaseName(file.name)}-edited`;
  }, [file]);

  const defaultSavedType = useMemo(() => {
    if (!file?.type) return "png";
    if (file.type.includes("png")) return "png";
    if (file.type.includes("webp")) return "webp";
    return "jpeg";
  }, [file?.type]);

  const devicePixelRatio = useMemo(() => {
    if (typeof window === "undefined") return 1;
    return Math.min(3, Math.max(1, window.devicePixelRatio || 1));
  }, []);

  // 5) Utils
  // No local utility helpers needed.

  // 6) Handlers
  const handleSave = useCallback(async (savedImageData: SavedImageData) => {
    try {
      const ext = savedImageData.extension || "png";
      const fallbackName = `${defaultName}.${ext}`;
      const outputName = savedImageData.fullName || savedImageData.name || fallbackName;
      const sourceExt = (file?.type?.split("/")[1] || "").toLowerCase();
      const normalizedSourceExt = sourceExt === "jpeg" ? "jpg" : sourceExt;
      const normalizedOutputExt = ext.toLowerCase() === "jpeg" ? "jpg" : ext.toLowerCase();

      if (!hasEditorChanges && file && normalizedSourceExt === normalizedOutputExt) {
        const originalBlob = file.slice(0, file.size, file.type || undefined);
        downloadBlob(originalBlob, outputName);
        toast.success("No edits detected, downloaded original image");
        return;
      }

      const blob = await toBlob(savedImageData);
      downloadBlob(blob, outputName);
      toast.success("Image edited and downloaded");
    } catch (error) {
      toast.error((error as Error).message || "Failed to save edited image");
    }
  }, [defaultName, file, hasEditorChanges]);

  // 7) Effects
  useEffect(() => {
    setHasEditorChanges(false);
  }, [file]);

  useEffect(() => {
    const primary = resolveToken("--primary", DEFAULT_EDITOR_THEME.palette["accent-primary"]);
    const foreground = resolveToken("--foreground", DEFAULT_EDITOR_THEME.palette["icons-primary"]);
    const mutedForeground = resolveToken("--muted-foreground", DEFAULT_EDITOR_THEME.palette["icons-secondary"]);
    const border = resolveToken("--border", DEFAULT_EDITOR_THEME.palette["borders-secondary"]);
    const muted = resolveToken("--muted", DEFAULT_EDITOR_THEME.palette["bg-primary-active"]);

    setEditorTheme({
      palette: {
        "bg-secondary": resolveToken("--card", DEFAULT_EDITOR_THEME.palette["bg-secondary"]),
        "bg-primary": resolveToken("--background", DEFAULT_EDITOR_THEME.palette["bg-primary"]),
        "bg-primary-hover": muted,
        "bg-primary-active": muted,
        "bg-hover": muted,
        "bg-active": resolveToken("--secondary", DEFAULT_EDITOR_THEME.palette["bg-active"]),
        "accent-primary": primary,
        "accent-primary-hover": primary,
        "accent-primary-active": primary,
        "accent-stateless": primary,
        "accent-1-2-opacity": DEFAULT_EDITOR_THEME.palette["accent-1-2-opacity"],
        "accent-primary-disabled": resolveToken("--input", DEFAULT_EDITOR_THEME.palette["accent-primary-disabled"]),
        "icons-primary": foreground,
        "icons-secondary": mutedForeground,
        "borders-secondary": border,
        "borders-primary": resolveToken("--input", DEFAULT_EDITOR_THEME.palette["borders-primary"]),
        "borders-strong": resolveToken("--ring", DEFAULT_EDITOR_THEME.palette["borders-strong"]),
        "borders-disabled": resolveToken("--input", DEFAULT_EDITOR_THEME.palette["borders-disabled"]),
        "borders-button": border,
        "link-stateless": mutedForeground,
        "link-hover": foreground,
        "btn-primary-text": resolveToken("--primary-foreground", DEFAULT_EDITOR_THEME.palette["btn-primary-text"]),
        "btn-primary-text-0-6": DEFAULT_EDITOR_THEME.palette["btn-primary-text-0-6"],
        "btn-primary-text-0-4": DEFAULT_EDITOR_THEME.palette["btn-primary-text-0-4"],
        "btn-disabled-text": resolveToken("--muted-foreground", DEFAULT_EDITOR_THEME.palette["btn-disabled-text"]),
        "btn-secondary-text": foreground,
        "light-shadow": DEFAULT_EDITOR_THEME.palette["light-shadow"],
        warning: resolveToken("--card", DEFAULT_EDITOR_THEME.palette.warning),
        "warning-hover": resolveToken("--card", DEFAULT_EDITOR_THEME.palette["warning-hover"]),
        "warning-active": resolveToken("--card", DEFAULT_EDITOR_THEME.palette["warning-active"]),
        error: resolveToken("--card", DEFAULT_EDITOR_THEME.palette.error),
        "error-hover": resolveToken("--card", DEFAULT_EDITOR_THEME.palette["error-hover"]),
        "error-active": resolveToken("--card", DEFAULT_EDITOR_THEME.palette["error-active"]),
        "bg-red": resolveToken("--card", DEFAULT_EDITOR_THEME.palette["bg-red"]),
        "bg-red-light": resolveToken("--card", DEFAULT_EDITOR_THEME.palette["bg-red-light"]),
        "background-red-medium": resolveToken("--card", DEFAULT_EDITOR_THEME.palette["background-red-medium"]),
        "borders-red": resolveToken("--border", DEFAULT_EDITOR_THEME.palette["borders-red"]),
        // "red-0-1-overlay": DEFAULT_EDITOR_THEME.palette["red-0-1-overlay"],
      },
      typography: DEFAULT_EDITOR_THEME.typography,
    });
  }, []);

  // 8) Render
  if (!file) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <UploadButtonFull
          title="Upload Image"
          subtitle="Supports JPG, PNG"
          label="Upload Image"
          accept="image/*,.heic,.heif"
          fileInputRef={fileInputRef}
          handleFileUpload={handleFileUpload}
          triggerFileInput={triggerFileInput}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0">
        <div className="fie-host">
          <StyleSheetManager
            shouldForwardProp={(propName, target) =>
              typeof target === "string" ? isPropValid(propName) : true
            }
          >
            <FilerobotImageEditor

              source={files[0].url}
              theme={editorTheme}
              onSave={handleSave}
              onModify={(state) => {
                const runtimeState = state as unknown as { haveNotSavedChanges?: boolean };
                setHasEditorChanges(Boolean(runtimeState?.haveNotSavedChanges));
              }}
              // onClose={() => undefined}
              closeAfterSave={false}
              savingPixelRatio={1}
              previewPixelRatio={devicePixelRatio}
              defaultSavedImageName={defaultName}
              defaultSavedImageType={defaultSavedType}
              defaultSavedImageQuality={0.92}
              previewBgColor="transparent"
              tabsIds={["Adjust", "Annotate", "Filters", "Finetune", "Resize", "Watermark"]}
              Crop={{ ratio: "custom" }}
              annotationsCommon={{
                fill: "#111827",
                stroke: "#111827",
              }}
              
              Text={{
                text: "your-domain.com",
                fontSize: 28,
                fill: "#111827",
              }}
              observePluginContainerSize
            />
          </StyleSheetManager>
        </div>
      </div>
    </div>
  );
}
