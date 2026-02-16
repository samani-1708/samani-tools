"use client";

import { useCallback, useMemo, useState } from "react";
import { UtilityToolLayout } from "@/app/utils/common/utility-tool-layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowUpDownIcon, ClipboardPasteIcon, CodeIcon, CopyIcon, EraserIcon } from "lucide-react";
import { toast } from "sonner";

type Mode = "encode" | "decode";
type TransformType = "base64" | "hex" | "uri" | "html";

const TRANSFORM_OPTIONS: Array<{ value: TransformType; label: string }> = [
  { value: "base64", label: "Base64" },
  { value: "hex", label: "Hex" },
  { value: "uri", label: "URI Component" },
  { value: "html", label: "HTML Entities" },
];

function encodeBase64(text: string): string {
  return btoa(unescape(encodeURIComponent(text)));
}

function decodeBase64(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  return decodeURIComponent(escape(atob(trimmed)));
}

function encodeHex(text: string): string {
  const bytes = new TextEncoder().encode(text);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join(" ");
}

function decodeHex(text: string): string {
  if (!text.trim()) return "";
  const cleaned = text.replace(/0x/gi, "").replace(/[\s,;:-]/g, "");
  if (cleaned.length % 2 !== 0) {
    throw new Error("Hex string must have an even number of characters.");
  }
  if (!/^[0-9a-fA-F]*$/.test(cleaned)) {
    throw new Error("Invalid hex characters detected.");
  }
  const hexPairs = cleaned.match(/.{2}/g) || [];
  return new TextDecoder().decode(
    new Uint8Array(hexPairs.map((h) => parseInt(h, 16)))
  );
}

function encodeUriComponent(text: string): string {
  return encodeURIComponent(text);
}

function decodeUriComponent(text: string): string {
  if (!text.trim()) return "";
  return decodeURIComponent(text);
}

function encodeHtmlEntities(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/[^\x00-\x7F]/g, (char) => `&#x${char.codePointAt(0)!.toString(16).toUpperCase()};`);
}

function decodeHtmlEntities(text: string): string {
  if (!text.trim()) return "";
  const namedEntities: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&apos;": "'",
    "&nbsp;": "\u00A0",
  };

  let result = text.replace(
    /&(?:amp|lt|gt|quot|apos|nbsp|#39);/gi,
    (match) => namedEntities[match.toLowerCase()] ?? match
  );

  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
    String.fromCodePoint(parseInt(hex, 16))
  );
  result = result.replace(/&#(\d+);/g, (_, dec) =>
    String.fromCodePoint(parseInt(dec, 10))
  );
  return result;
}

const transforms: Record<Mode, Record<TransformType, (text: string) => string>> = {
  encode: {
    base64: encodeBase64,
    hex: encodeHex,
    uri: encodeUriComponent,
    html: encodeHtmlEntities,
  },
  decode: {
    base64: decodeBase64,
    hex: decodeHex,
    uri: decodeUriComponent,
    html: decodeHtmlEntities,
  },
};

export function PageClient() {
  const [mode, setMode] = useState<Mode>("encode");
  const [transformType, setTransformType] = useState<TransformType>("base64");
  const [inputText, setInputText] = useState("");

  const result = useMemo(() => {
    if (!inputText.trim()) return { output: "", error: "" };
    try {
      return {
        output: transforms[mode][transformType](inputText),
        error: "",
      };
    } catch (error) {
      return {
        output: "",
        error: error instanceof Error ? error.message : "Transformation failed.",
      };
    }
  }, [inputText, mode, transformType]);

  const handleCopy = useCallback(async () => {
    if (!result.output) return;
    try {
      await navigator.clipboard.writeText(result.output);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  }, [result.output]);

  const handlePaste = useCallback(async () => {
    try {
      const value = await navigator.clipboard.readText();
      setInputText(value);
      toast.success("Pasted from clipboard");
    } catch {
      toast.error("Clipboard access denied");
    }
  }, []);

  const handleSwap = useCallback(() => {
    if (!result.output) return;
    setInputText(result.output);
    setMode((prev) => (prev === "encode" ? "decode" : "encode"));
  }, [result.output]);

  const handleClear = useCallback(() => {
    setInputText("");
  }, []);

  const content = (
    <div className="h-full flex flex-col gap-4">
      <div className="flex-[4] flex flex-col gap-1.5 min-h-0">
        <Label htmlFor="input-text">Input</Label>
        <textarea
          id="input-text"
          placeholder={
            mode === "encode"
              ? "Paste plain text to encode..."
              : "Paste encoded text to decode..."
          }
          className="flex-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none font-mono"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
      </div>

      <div className="flex-[6] flex flex-col gap-1.5 min-h-0">
        <div className="flex items-center justify-between">
          <Label htmlFor="output-text">Output</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            disabled={!result.output}
            className="h-7 gap-1.5 text-xs"
          >
            <CopyIcon className="w-3.5 h-3.5" />
            Copy
          </Button>
        </div>
        <textarea
          id="output-text"
          className="flex-1 w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm shadow-xs resize-none font-mono"
          value={result.output}
          readOnly
          placeholder="Result will appear here..."
        />
        {result.error && (
          <p className="text-sm text-red-500 dark:text-red-400">{result.error}</p>
        )}
      </div>
    </div>
  );

  const controls = (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Mode</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={mode === "encode" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("encode")}
          >
            Encode
          </Button>
          <Button
            variant={mode === "decode" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("decode")}
          >
            Decode
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Type</Label>
        <div className="space-y-2">
          {TRANSFORM_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={transformType === option.value ? "default" : "outline"}
              size="sm"
              className="w-full justify-start"
              onClick={() => setTransformType(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );

  const actions = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <Button variant="outline" onClick={handlePaste}>
        <ClipboardPasteIcon className="w-4 h-4 mr-2" />
        Paste
      </Button>
      <Button variant="outline" onClick={handleClear} disabled={!inputText}>
        <EraserIcon className="w-4 h-4 mr-2" />
        Clear
      </Button>
    </div>
  );

  const secondaryActions = (
    <Button
      variant="outline"
      className="w-full"
      onClick={handleSwap}
      disabled={!result.output}
    >
      <ArrowUpDownIcon className="w-4 h-4 mr-2" />
      Swap & Reverse Mode
    </Button>
  );

  return (
    <UtilityToolLayout
      sidebarTitle="Text Encode Decode"
      sidebarIcon={<CodeIcon className="w-5 h-5" />}
      sidebarWidth="sm"
      content={content}
      controls={controls}
      actions={actions}
      secondaryActions={secondaryActions}
    />
  );
}
