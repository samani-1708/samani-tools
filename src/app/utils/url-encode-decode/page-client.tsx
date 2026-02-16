"use client";

import { useState, useCallback, useEffect } from "react";
import { UtilityToolLayout } from "@/app/utils/common/utility-tool-layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LinkIcon, CopyIcon } from "lucide-react";
import { toast } from "sonner";

type Mode = "encode" | "decode";
type Method = "component" | "full";

function tryParseUrl(text: string): URL | null {
  try {
    return new URL(text);
  } catch {
    return null;
  }
}

export function PageClient() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [mode, setMode] = useState<Mode>("encode");
  const [method, setMethod] = useState<Method>("component");

  const convert = useCallback(
    (input: string) => {
      if (!input.trim()) {
        setOutputText("");
        return;
      }
      try {
        if (mode === "encode") {
          setOutputText(
            method === "component"
              ? encodeURIComponent(input)
              : encodeURI(input)
          );
        } else {
          setOutputText(
            method === "component"
              ? decodeURIComponent(input)
              : decodeURI(input)
          );
        }
      } catch {
        setOutputText("Error: Invalid input for the selected operation.");
      }
    },
    [mode, method]
  );

  // Live conversion on input change or mode/method change
  useEffect(() => {
    convert(inputText);
  }, [inputText, convert]);

  const handleCopy = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText);
    toast.success("Copied to clipboard");
  };

  // Determine which text to try parsing as a URL for the breakdown
  const urlToParse = mode === "decode" ? outputText : inputText;
  const parsedUrl = tryParseUrl(urlToParse);

  const content = (
    <div className="flex flex-col gap-4 h-full">
      {/* Input */}
      <div className="flex flex-col gap-1.5 flex-1 min-h-0">
        <Label htmlFor="input">Input</Label>
        <textarea
          id="input"
          className="flex-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none font-mono"
          placeholder={
            mode === "encode"
              ? "Enter text or URL to encode..."
              : "Enter encoded text to decode..."
          }
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
      </div>

      {/* Output */}
      <div className="flex flex-col gap-1.5 flex-1 min-h-0">
        <div className="flex items-center justify-between">
          <Label htmlFor="output">Output</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            disabled={!outputText}
            className="h-7 px-2 text-xs"
          >
            <CopyIcon className="w-3.5 h-3.5 mr-1" />
            Copy
          </Button>
        </div>
        <textarea
          id="output"
          className="flex-1 w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm shadow-xs resize-none font-mono"
          value={outputText}
          readOnly
        />
      </div>

      {/* URL Breakdown Table */}
      {parsedUrl && (
        <div className="rounded-md border border-input bg-muted/30 overflow-hidden">
          <div className="px-3 py-2 bg-muted/50 border-b border-input">
            <span className="text-sm font-medium">URL Breakdown</span>
          </div>
          <div className="divide-y divide-input text-sm">
            <div className="flex">
              <span className="w-32 shrink-0 px-3 py-1.5 font-medium bg-muted/20">
                Protocol
              </span>
              <span className="px-3 py-1.5 font-mono break-all">
                {parsedUrl.protocol}
              </span>
            </div>
            <div className="flex">
              <span className="w-32 shrink-0 px-3 py-1.5 font-medium bg-muted/20">
                Host
              </span>
              <span className="px-3 py-1.5 font-mono break-all">
                {parsedUrl.host}
              </span>
            </div>
            <div className="flex">
              <span className="w-32 shrink-0 px-3 py-1.5 font-medium bg-muted/20">
                Pathname
              </span>
              <span className="px-3 py-1.5 font-mono break-all">
                {parsedUrl.pathname}
              </span>
            </div>
            {Array.from(parsedUrl.searchParams.entries()).map(
              ([key, value], i) => (
                <div className="flex" key={`${key}-${i}`}>
                  <span className="w-32 shrink-0 px-3 py-1.5 font-medium bg-muted/20">
                    Query: {key}
                  </span>
                  <span className="px-3 py-1.5 font-mono break-all">
                    {value}
                  </span>
                </div>
              )
            )}
            {parsedUrl.hash && (
              <div className="flex">
                <span className="w-32 shrink-0 px-3 py-1.5 font-medium bg-muted/20">
                  Fragment
                </span>
                <span className="px-3 py-1.5 font-mono break-all">
                  {parsedUrl.hash}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const controls = (
    <div className="space-y-6">
      {/* Mode */}
      <div className="space-y-2">
        <Label>Mode</Label>
        <div className="flex gap-2">
          <Button
            variant={mode === "encode" ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => setMode("encode")}
          >
            Encode
          </Button>
          <Button
            variant={mode === "decode" ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => setMode("decode")}
          >
            Decode
          </Button>
        </div>
      </div>

      {/* Method (only in encode mode) */}
      {mode === "encode" && (
        <div className="space-y-2">
          <Label>Method</Label>
          <div className="flex flex-col gap-2">
            <Button
              variant={method === "component" ? "default" : "outline"}
              size="sm"
              onClick={() => setMethod("component")}
            >
              encodeURIComponent
            </Button>
            <Button
              variant={method === "full" ? "default" : "outline"}
              size="sm"
              onClick={() => setMethod("full")}
            >
              encodeURI
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  const actions = (
    <Button className="w-full" onClick={() => convert(inputText)}>
      <LinkIcon className="w-4 h-4 mr-2" />
      {mode === "encode" ? "Encode" : "Decode"}
    </Button>
  );

  return (
    <UtilityToolLayout
      sidebarTitle="URL Encode/Decode"
      sidebarIcon={<LinkIcon className="w-5 h-5" />}
      sidebarWidth="sm"
      content={content}
      controls={controls}
      actions={actions}
    />
  );
}
