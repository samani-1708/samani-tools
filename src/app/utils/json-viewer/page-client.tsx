"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { UtilityToolLayout } from "@/app/utils/common/utility-tool-layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { BracesIcon, CopyIcon, Minimize2Icon, Maximize2Icon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import JsonView from "@uiw/react-json-view";

type Tab = "input" | "tree" | "formatted";

function countKeys(data: unknown): number {
  if (data === null || typeof data !== "object") return 0;
  if (Array.isArray(data)) {
    return data.reduce((sum: number, item) => sum + countKeys(item), 0);
  }
  const keys = Object.keys(data as Record<string, unknown>);
  return keys.length + keys.reduce((sum: number, key) => sum + countKeys((data as Record<string, unknown>)[key]), 0);
}

function maxDepth(data: unknown, depth: number = 0): number {
  if (data === null || typeof data !== "object") return depth;
  if (Array.isArray(data)) {
    if (data.length === 0) return depth + 1;
    return Math.max(...data.map((item) => maxDepth(item, depth + 1)));
  }
  const values = Object.values(data as Record<string, unknown>);
  if (values.length === 0) return depth + 1;
  return Math.max(...values.map((val) => maxDepth(val, depth + 1)));
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function nodeMatchesSearch(data: unknown, name: string, searchTerm: string): boolean {
  const lower = searchTerm.toLowerCase();
  if (name.toLowerCase().includes(lower)) return true;
  if (typeof data === "string" && data.toLowerCase().includes(lower)) return true;
  if (typeof data === "number" && String(data).toLowerCase().includes(lower)) return true;
  if (typeof data === "boolean" && String(data).toLowerCase().includes(lower)) return true;
  if (data === null && "null".includes(lower)) return true;
  if (data !== null && typeof data === "object") {
    if (Array.isArray(data)) {
      return data.some((item, i) => nodeMatchesSearch(item, String(i), searchTerm));
    }
    return Object.entries(data as Record<string, unknown>).some(([key, val]) =>
      nodeMatchesSearch(val, key, searchTerm)
    );
  }
  return false;
}

function filterJsonTree(
  data: unknown,
  searchTerm: string,
  name: string = "root"
): unknown {
  if (!searchTerm.trim()) return data;
  if (!nodeMatchesSearch(data, name, searchTerm)) return undefined;

  if (Array.isArray(data)) {
    const filteredArray = data
      .map((item, index) => filterJsonTree(item, searchTerm, String(index)))
      .filter((item) => item !== undefined);
    return filteredArray;
  }

  if (data !== null && typeof data === "object") {
    const filteredObject: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const filteredChild = filterJsonTree(value, searchTerm, key);
      if (filteredChild !== undefined) {
        filteredObject[key] = filteredChild;
      }
    }
    return filteredObject;
  }

  return data;
}

export function PageClient() {
  // 1) Props
  // No props for this page component.

  // 2) State
  const [inputText, setInputText] = useState("");
  const [parsedJson, setParsedJson] = useState<unknown | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("input");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewerCollapsed, setViewerCollapsed] = useState<boolean | number>(1);

  // 3) Custom hooks
  // No custom hooks.

  // 4) Derived props and state
  const formattedJson = useMemo(() => {
    if (parsedJson === null && !inputText) return "";
    try {
      return JSON.stringify(parsedJson, null, 2);
    } catch {
      return "";
    }
  }, [parsedJson, inputText]);

  const stats = useMemo(() => {
    if (!parsedJson) return null;
    const jsonStr = formattedJson || inputText;
    return {
      keys: countKeys(parsedJson),
      depth: maxDepth(parsedJson),
      size: formatSize(new Blob([jsonStr]).size),
    };
  }, [parsedJson, formattedJson, inputText]);

  const filteredJson = useMemo(() => {
    if (!parsedJson) return null;
    const filtered = filterJsonTree(parsedJson, searchTerm, "root");
    return filtered === undefined ? null : filtered;
  }, [parsedJson, searchTerm]);

  const effectiveCollapsed = searchTerm.trim() ? false : viewerCollapsed;

  // 5) Utils
  // No local utility helpers.

  // 6) Handlers
  const handleFormat = () => {
    if (!inputText.trim()) {
      toast.error("Please enter some JSON first");
      return;
    }
    try {
      const parsed = JSON.parse(inputText);
      setParsedJson(parsed);
      setError("");
      setInputText(JSON.stringify(parsed, null, 2));
      toast.success("JSON formatted successfully");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Invalid JSON";
      setError(msg);
      setParsedJson(null);
      toast.error(`Invalid JSON: ${msg}`);
    }
  };

  const handleMinify = () => {
    if (!inputText.trim()) {
      toast.error("Please enter some JSON first");
      return;
    }
    try {
      const parsed = JSON.parse(inputText);
      setParsedJson(parsed);
      setError("");
      setInputText(JSON.stringify(parsed));
      toast.success("JSON minified successfully");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Invalid JSON";
      setError(msg);
      setParsedJson(null);
      toast.error(`Invalid JSON: ${msg}`);
    }
  };

  const handleCopyFormatted = async () => {
    if (!formattedJson) {
      toast.error("No formatted JSON to copy");
      return;
    }
    try {
      await navigator.clipboard.writeText(formattedJson);
      toast.success("Copied formatted JSON to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleExpandAll = () => {
    setViewerCollapsed(false);
  };

  const handleCollapseAll = () => {
    setViewerCollapsed(1);
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "input", label: "Input" },
    { key: "tree", label: "Tree View" },
    { key: "formatted", label: "Formatted" },
  ];

  // 7) Effects
  // No effects needed.

  // 8) Render
  const content = (
    <div className="flex flex-col gap-4 h-full">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              if (t.key !== "input" && !parsedJson && inputText.trim()) {
                // Auto-parse when switching to tree/formatted
                try {
                  const parsed = JSON.parse(inputText);
                  setParsedJson(parsed);
                  setError("");
                } catch (e) {
                  const msg = e instanceof Error ? e.message : "Invalid JSON";
                  setError(msg);
                  toast.error(`Invalid JSON: ${msg}`);
                  return;
                }
              }
              setActiveTab(t.key);
            }}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              activeTab === t.key
                ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Error display */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Tab content */}
      {activeTab === "input" && (
        <div className="flex flex-col gap-3 flex-1">
          <textarea
            placeholder="Paste JSON here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none font-mono"
          />
          <div className="flex gap-2">
            <Button onClick={handleFormat} variant="default" size="sm">
              Format
            </Button>
            <Button onClick={handleMinify} variant="outline" size="sm">
              Minify
            </Button>
          </div>
        </div>
      )}

      {activeTab === "tree" && (
        <div className="flex-1 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-950 font-mono text-sm">
          {filteredJson !== null && filteredJson !== undefined ? (
            <JsonView
              key={`${searchTerm}-${String(effectiveCollapsed)}`}
              value={filteredJson}
              collapsed={effectiveCollapsed}
              displayDataTypes={false}
              displayObjectSize={true}
              enableClipboard={false}
              shortenTextAfterLength={80}
              style={
                {
                  "--w-rjv-background-color": "transparent",
                  "--w-rjv-color": "hsl(var(--foreground))",
                  "--w-rjv-key-string": "hsl(var(--primary))",
                  "--w-rjv-type-string-color": "hsl(142 71% 45%)",
                  "--w-rjv-type-int-color": "hsl(215 90% 55%)",
                  "--w-rjv-type-boolean-color": "hsl(25 95% 53%)",
                  "--w-rjv-type-null-color": "hsl(var(--muted-foreground))",
                } as CSSProperties
              }
            />
          ) : (
            <p className="text-gray-400 text-sm">
              {searchTerm
                ? "No matching node for this search term."
                : "Parse some JSON first using the Input tab."}
            </p>
          )}
        </div>
      )}

      {activeTab === "formatted" && (
        <div className="flex-1 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-950">
          {formattedJson ? (
            <pre className="text-sm font-mono whitespace-pre-wrap break-words text-foreground">
              {formattedJson}
            </pre>
          ) : (
            <p className="text-gray-400 text-sm">Parse some JSON first using the Input tab.</p>
          )}
        </div>
      )}
    </div>
  );

  const controls = (
    <div className="space-y-6">
      {/* Search */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Search</Label>
        <Input
          placeholder="Filter by key or value..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="text-sm"
        />
      </div>

      {/* Expand / Collapse */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Tree Controls</Label>
        <div className="flex gap-2">
          <Button onClick={handleExpandAll} variant="outline" size="sm" className="flex-1">
            <Maximize2Icon className="w-3.5 h-3.5 mr-1.5" />
            Expand All
          </Button>
          <Button onClick={handleCollapseAll} variant="outline" size="sm" className="flex-1">
            <Minimize2Icon className="w-3.5 h-3.5 mr-1.5" />
            Collapse All
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Stats</Label>
          <div className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex justify-between">
              <span>Total Keys</span>
              <span className="font-mono font-medium text-gray-900 dark:text-gray-200">{stats.keys}</span>
            </div>
            <div className="flex justify-between">
              <span>Max Depth</span>
              <span className="font-mono font-medium text-gray-900 dark:text-gray-200">{stats.depth}</span>
            </div>
            <div className="flex justify-between">
              <span>Size</span>
              <span className="font-mono font-medium text-gray-900 dark:text-gray-200">{stats.size}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const actions = (
    <Button onClick={handleCopyFormatted} className="w-full" disabled={!formattedJson}>
      <CopyIcon className="w-4 h-4 mr-2" />
      Copy Formatted JSON
    </Button>
  );

  return (
    <UtilityToolLayout
      sidebarTitle="JSON Viewer"
      sidebarIcon={<BracesIcon className="w-5 h-5" />}
      content={content}
      controls={controls}
      actions={actions}
    />
  );
}
