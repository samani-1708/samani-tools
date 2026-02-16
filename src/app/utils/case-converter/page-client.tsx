"use client";

import { useCallback, useMemo, useState } from "react";
import { UtilityToolLayout } from "@/app/utils/common/utility-tool-layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowUpDownIcon, CaseSensitiveIcon, CopyIcon, EraserIcon, ClipboardPasteIcon } from "lucide-react";
import { toast } from "sonner";

function splitWords(text: string): string[] {
  const expanded = text
    // normalize common separators first
    .replace(/[_\-.]+/g, " ")
    // split: myURLValue -> my URL Value
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    // split: myValue -> my Value, value2Test -> value2 Test
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    // split: version2Value -> version 2 Value
    .replace(/([a-zA-Z])(\d)/g, "$1 $2")
    .replace(/(\d)([a-zA-Z])/g, "$1 $2");

  return expanded
    .split(/[^\p{L}\p{N}]+/gu)
    .map((word) => word.trim())
    .filter(Boolean);
}

function toCamelCase(words: string[]): string {
  if (words.length === 0) return "";
  return words
    .map((w, i) =>
      i === 0
        ? w.toLowerCase()
        : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    )
    .join("");
}

function toPascalCase(words: string[]): string {
  return words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

function toSnakeCase(words: string[]): string {
  return words.map((w) => w.toLowerCase()).join("_");
}

function toScreamingSnakeCase(words: string[]): string {
  return words.map((w) => w.toUpperCase()).join("_");
}

function toKebabCase(words: string[]): string {
  return words.map((w) => w.toLowerCase()).join("-");
}

function toScreamingKebabCase(words: string[]): string {
  return words.map((w) => w.toUpperCase()).join("-");
}

function toDotCase(words: string[]): string {
  return words.map((w) => w.toLowerCase()).join(".");
}

function toTitleCase(words: string[]): string {
  return words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function toUpperCase(words: string[]): string {
  return words.map((w) => w.toUpperCase()).join(" ");
}

function toLowerCase(words: string[]): string {
  return words.map((w) => w.toLowerCase()).join(" ");
}

function toSentenceCase(words: string[]): string {
  if (words.length === 0) return "";
  return words
    .map((w, i) =>
      i === 0
        ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
        : w.toLowerCase()
    )
    .join(" ");
}

type CaseType =
  | "camelCase"
  | "PascalCase"
  | "snake_case"
  | "SCREAMING_SNAKE"
  | "kebab-case"
  | "SCREAMING-KEBAB"
  | "dot.case"
  | "Title Case"
  | "UPPERCASE"
  | "lowercase"
  | "Sentence case";

const CASE_OPTIONS: Array<{ value: CaseType; label: string }> = [
  { value: "camelCase", label: "camelCase" },
  { value: "PascalCase", label: "PascalCase" },
  { value: "snake_case", label: "snake_case" },
  { value: "SCREAMING_SNAKE", label: "SCREAMING_SNAKE" },
  { value: "kebab-case", label: "kebab-case" },
  { value: "SCREAMING-KEBAB", label: "SCREAMING-KEBAB" },
  { value: "dot.case", label: "dot.case" },
  { value: "Title Case", label: "Title Case" },
  { value: "UPPERCASE", label: "UPPERCASE" },
  { value: "lowercase", label: "lowercase" },
  { value: "Sentence case", label: "Sentence case" },
];

const converters: Record<CaseType, (words: string[]) => string> = {
  camelCase: toCamelCase,
  PascalCase: toPascalCase,
  snake_case: toSnakeCase,
  SCREAMING_SNAKE: toScreamingSnakeCase,
  "kebab-case": toKebabCase,
  "SCREAMING-KEBAB": toScreamingKebabCase,
  "dot.case": toDotCase,
  "Title Case": toTitleCase,
  UPPERCASE: toUpperCase,
  lowercase: toLowerCase,
  "Sentence case": toSentenceCase,
};

function convertText(text: string, caseType: CaseType): string {
  if (!text) return "";

  return text
    .split("\n")
    .map((line) => {
      const words = splitWords(line);
      if (words.length === 0) return line.trim() ? line : "";
      return converters[caseType](words);
    })
    .join("\n");
}

export function PageClient() {
  // 1) Props
  // No props for this page component.

  // 2) State
  const [inputText, setInputText] = useState("");
  const [selectedCase, setSelectedCase] = useState<CaseType>("camelCase");

  // 3) Custom hooks
  // No custom hooks.

  // 4) Derived props and states
  const outputText = useMemo(
    () => convertText(inputText, selectedCase),
    [inputText, selectedCase]
  );
  const hasInput = inputText.trim().length > 0;

  // 5) Utils
  // No local utility helpers.

  // 6) Handlers
  const handleCopy = useCallback(() => {
    if (!outputText) return;
    navigator.clipboard
      .writeText(outputText)
      .then(() => toast.success("Copied to clipboard"))
      .catch(() => toast.error("Failed to copy"));
  }, [outputText]);

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
    if (!outputText) return;
    setInputText(outputText);
  }, [outputText]);

  const handleClear = useCallback(() => {
    setInputText("");
  }, []);

  // 7) Effects
  // No effects needed.

  // 8) Render
  const content = (
    <div className="h-full flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>Chars: {inputText.length}</span>
        <span>Words: {splitWords(inputText).length}</span>
        <span>Lines: {inputText ? inputText.split("\n").length : 0}</span>
      </div>
      <div className="flex-1 flex flex-col gap-1.5 min-h-0">
        <Label htmlFor="input-text">Input</Label>
        <textarea
          id="input-text"
          placeholder="Paste or type your text here..."
          className="flex-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none font-mono"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
      </div>
      <div className="flex-1 flex flex-col gap-1.5 min-h-0">
        <div className="flex items-center justify-between">
          <Label htmlFor="output-text">Output</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            disabled={!outputText}
            className="h-7 gap-1.5 text-xs"
          >
            <CopyIcon className="w-3.5 h-3.5" />
            Copy
          </Button>
        </div>
        <textarea
          id="output-text"
          className="flex-1 w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm shadow-xs resize-none font-mono"
          value={outputText}
          readOnly
          placeholder="Converted text will appear here..."
        />
      </div>
    </div>
  );

  const controls = (
    <div className="grid grid-cols-2 gap-2">
      {CASE_OPTIONS.map((option) => (
        <Button
          key={option.value}
          variant={selectedCase === option.value ? "default" : "outline"}
          size="sm"
          className="text-xs justify-start"
          onClick={() => setSelectedCase(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );

  const actions = (
    <div className="grid grid-cols-2 gap-2">
      <Button className="w-full" disabled={!outputText} onClick={handleCopy}>
        <CopyIcon className="w-4 h-4 mr-2" />
        Copy Output
      </Button>
      <Button className="w-full" variant="outline" onClick={handlePaste}>
        <ClipboardPasteIcon className="w-4 h-4 mr-2" />
        Paste
      </Button>
    </div>
  );

  const secondaryActions = (
    <div className="grid grid-cols-2 gap-2">
      <Button variant="outline" className="w-full" disabled={!outputText} onClick={handleSwap}>
        <ArrowUpDownIcon className="w-4 h-4 mr-2" />
        Use as Input
      </Button>
      <Button variant="outline" className="w-full" disabled={!hasInput} onClick={handleClear}>
        <EraserIcon className="w-4 h-4 mr-2" />
        Clear
      </Button>
    </div>
  );

  return (
    <UtilityToolLayout
      sidebarTitle="Case Converter"
      sidebarIcon={<CaseSensitiveIcon className="w-5 h-5" />}
      sidebarWidth="sm"
      content={content}
      controls={controls}
      actions={actions}
      secondaryActions={secondaryActions}
    />
  );
}
