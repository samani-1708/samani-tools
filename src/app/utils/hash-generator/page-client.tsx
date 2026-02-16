"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { UtilityToolLayout } from "@/app/utils/common/utility-tool-layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  ClipboardPasteIcon,
  CopyIcon,
  DownloadIcon,
  EraserIcon,
  FingerprintIcon,
  UploadIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import CryptoJS from "crypto-js";

type Tab = "text" | "file";

type AlgorithmKey =
  | "MD5"
  | "SHA-1"
  | "SHA-224"
  | "SHA-256"
  | "SHA-384"
  | "SHA-512"
  | "RIPEMD-160"
  | "SHA3-224"
  | "SHA3-256"
  | "SHA3-384"
  | "SHA3-512";

const ALL_ALGORITHMS: AlgorithmKey[] = [
  "MD5",
  "SHA-1",
  "SHA-224",
  "SHA-256",
  "SHA-384",
  "SHA-512",
  "RIPEMD-160",
  "SHA3-224",
  "SHA3-256",
  "SHA3-384",
  "SHA3-512",
] as const;

const DEFAULT_ALGORITHMS: AlgorithmKey[] = ["MD5", "SHA-1", "SHA-256", "SHA-512"] as const;
const FILE_CHUNK_SIZE = 4 * 1024 * 1024;
type CryptoHasher = ReturnType<typeof CryptoJS.algo.SHA256.create>;

function arrayBufferToWordArray(buffer: ArrayBuffer): CryptoJS.lib.WordArray {
  const bytes = new Uint8Array(buffer);
  const words: number[] = [];
  for (let i = 0; i < bytes.length; i += 1) {
    words[i >>> 2] |= bytes[i] << (24 - (i % 4) * 8);
  }
  return CryptoJS.lib.WordArray.create(words, bytes.length);
}

function createHasher(algo: AlgorithmKey): CryptoHasher {
  switch (algo) {
    case "MD5":
      return CryptoJS.algo.MD5.create();
    case "SHA-1":
      return CryptoJS.algo.SHA1.create();
    case "SHA-224":
      return CryptoJS.algo.SHA224.create();
    case "SHA-256":
      return CryptoJS.algo.SHA256.create();
    case "SHA-384":
      return CryptoJS.algo.SHA384.create();
    case "SHA-512":
      return CryptoJS.algo.SHA512.create();
    case "RIPEMD-160":
      return CryptoJS.algo.RIPEMD160.create();
    case "SHA3-224":
      return CryptoJS.algo.SHA3.create({ outputLength: 224 });
    case "SHA3-256":
      return CryptoJS.algo.SHA3.create({ outputLength: 256 });
    case "SHA3-384":
      return CryptoJS.algo.SHA3.create({ outputLength: 384 });
    case "SHA3-512":
      return CryptoJS.algo.SHA3.create({ outputLength: 512 });
    default: {
      const _exhaustive: never = algo;
      throw new Error(`Unsupported algorithm: ${_exhaustive}`);
    }
  }
}

export function PageClient() {
  // 1) Props
  // No props for this page component.

  // 2) State
  const [tab, setTab] = useState<Tab>("text");
  const [inputText, setInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [algorithms, setAlgorithms] = useState<Record<AlgorithmKey, boolean>>(() =>
    Object.fromEntries(
      ALL_ALGORITHMS.map((algo) => [algo, DEFAULT_ALGORITHMS.includes(algo)])
    ) as Record<AlgorithmKey, boolean>
  );
  const [uppercase, setUppercase] = useState(false);
  const [results, setResults] = useState<Record<AlgorithmKey, string>>({} as Record<AlgorithmKey, string>);
  const [isHashing, setIsHashing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 3) Custom hooks
  // No custom hooks.

  // 4) Derived props and state
  const checkedAlgos = useMemo(
    () => ALL_ALGORITHMS.filter((a) => algorithms[a]),
    [algorithms]
  );
  const displayResults = useMemo(
    () =>
      checkedAlgos
        .filter((algo) => Boolean(results[algo]))
        .map((algo) => [algo, results[algo]] as const),
    [checkedAlgos, results]
  );
  const hasInput =
    tab === "text" ? inputText.trim().length > 0 : Boolean(selectedFile);

  // 5) Utils
  // No local utility helpers.

  // 6) Handlers
  const toggleAlgorithm = (algo: AlgorithmKey) => {
    setAlgorithms((prev) => ({ ...prev, [algo]: !prev[algo] }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0] ?? null;
    setSelectedFile(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const copyToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handlePasteText = useCallback(async () => {
    try {
      const value = await navigator.clipboard.readText();
      setInputText(value);
      setTab("text");
      toast.success("Pasted from clipboard");
    } catch {
      toast.error("Clipboard access denied");
    }
  }, []);

  const clearAll = useCallback(() => {
    setInputText("");
    setSelectedFile(null);
    setResults({} as Record<AlgorithmKey, string>);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const downloadResults = useCallback(() => {
    if (displayResults.length === 0) return;
    const lines = [
      `Input Type: ${tab === "text" ? "Text" : "File"}`,
      tab === "text"
        ? `Text Length: ${inputText.length} chars`
        : `File: ${selectedFile?.name ?? "-"}`,
      "",
      ...displayResults.map(([algo, hash]) => `${algo}: ${hash}`),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = "hashes.txt";
    a.click();
    URL.revokeObjectURL(href);
  }, [displayResults, inputText.length, selectedFile?.name, tab]);

  const hashText = useCallback(
    (text: string, selected: AlgorithmKey[]): Record<AlgorithmKey, string> => {
      const wordArray = CryptoJS.enc.Utf8.parse(text);
      const next = {} as Record<AlgorithmKey, string>;
      for (const algo of selected) {
        const hasher = createHasher(algo);
        hasher.update(wordArray);
        const hex = hasher.finalize().toString(CryptoJS.enc.Hex);
        next[algo] = uppercase ? hex.toUpperCase() : hex.toLowerCase();
      }
      return next;
    },
    [uppercase]
  );

  const hashFile = useCallback(
    async (file: File, selected: AlgorithmKey[]): Promise<Record<AlgorithmKey, string>> => {
      const hashers = Object.fromEntries(
        selected.map((algo) => [algo, createHasher(algo)])
      ) as Record<AlgorithmKey, CryptoHasher>;

      for (let offset = 0; offset < file.size; offset += FILE_CHUNK_SIZE) {
        const chunk = file.slice(offset, offset + FILE_CHUNK_SIZE);
        const chunkBuffer = await chunk.arrayBuffer();
        const wordArray = arrayBufferToWordArray(chunkBuffer);
        for (const algo of selected) {
          hashers[algo].update(wordArray);
        }
      }

      const next = {} as Record<AlgorithmKey, string>;
      for (const algo of selected) {
        const hex = hashers[algo].finalize().toString(CryptoJS.enc.Hex);
        next[algo] = uppercase ? hex.toUpperCase() : hex.toLowerCase();
      }
      return next;
    },
    [uppercase]
  );

  const generateHashes = async () => {
    if (checkedAlgos.length === 0) {
      toast.error("Select at least one algorithm");
      return;
    }

    if (tab === "text") {
      if (!inputText.trim()) {
        toast.error("Enter some text to hash");
        return;
      }
    } else {
      if (!selectedFile) {
        toast.error("Select a file to hash");
        return;
      }
    }

    setIsHashing(true);
    try {
      const newResults =
        tab === "text"
          ? hashText(inputText, checkedAlgos)
          : await hashFile(selectedFile as File, checkedAlgos);
      setResults(newResults);
      toast.success("Hashes generated");
    } catch {
      toast.error("Hashing failed");
    } finally {
      setIsHashing(false);
    }
  };

  const content = (
    <div className="flex flex-col gap-4 h-full">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab("text")}
          className={cn(
            "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
            tab === "text"
              ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          )}
        >
          Text
        </button>
        <button
          onClick={() => setTab("file")}
          className={cn(
            "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
            tab === "file"
              ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          )}
        >
          File
        </button>
      </div>

      {/* Input area */}
      {tab === "text" ? (
        <textarea
          placeholder="Enter text to hash..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 min-h-[160px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none font-mono"
        />
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 min-h-[160px] border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
        >
          <UploadIcon className="w-8 h-8 text-gray-400" />
          {selectedFile ? (
            <div className="text-center">
              <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                {selectedFile.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Drop a file here or click to select
            </p>
          )}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      {/* Results */}
      {displayResults.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Results</Label>
          <div className="space-y-2">
            {displayResults.map(([algo, hash]) => (
              <div
                key={algo}
                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide mt-0.5 whitespace-nowrap min-w-[60px]">
                  {algo}
                </span>
                <code className="flex-1 text-xs font-mono break-all text-gray-800 dark:text-gray-200">
                  {hash}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 flex-shrink-0"
                  onClick={() => copyToClipboard(hash)}
                >
                  <CopyIcon className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const controls = (
    <div className="space-y-6">
      {/* Algorithm checkboxes */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Algorithms</Label>
        <div className="grid grid-cols-2 gap-2">
          {ALL_ALGORITHMS.map((algo) => (
            <label
              key={algo}
              className="flex items-center gap-2 cursor-pointer rounded border border-input p-2"
            >
              <input
                type="checkbox"
                checked={algorithms[algo]}
                onChange={() => toggleAlgorithm(algo)}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              <span className="text-sm">{algo}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Uppercase toggle */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Hex Output</Label>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setUppercase(false)}
            className={cn(
              "flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              !uppercase
                ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            lowercase
          </button>
          <button
            onClick={() => setUppercase(true)}
            className={cn(
              "flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              uppercase
                ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            UPPERCASE
          </button>
        </div>
      </div>
    </div>
  );

  const actions = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <Button onClick={generateHashes} disabled={isHashing || !hasInput} className="w-full">
        {isHashing ? "Hashing..." : "Generate Hash"}
      </Button>
      <Button
        variant="outline"
        onClick={downloadResults}
        disabled={displayResults.length === 0}
        className="w-full"
      >
        <DownloadIcon className="w-4 h-4 mr-2" />
        Download
      </Button>
    </div>
  );

  const secondaryActions = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <Button variant="outline" onClick={handlePasteText} className="w-full">
        <ClipboardPasteIcon className="w-4 h-4 mr-2" />
        Paste Text
      </Button>
      <Button variant="outline" onClick={clearAll} className="w-full">
        <EraserIcon className="w-4 h-4 mr-2" />
        Clear
      </Button>
    </div>
  );

  return (
    <UtilityToolLayout
      sidebarTitle="Hash Generator"
      sidebarIcon={<FingerprintIcon className="w-5 h-5" />}
      content={content}
      controls={controls}
      actions={actions}
      secondaryActions={secondaryActions}
    />
  );
}
