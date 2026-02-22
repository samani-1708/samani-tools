"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useFileUpload } from "@/app/common/hooks";
import { UploadButtonFull } from "@/app/common/upload";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  BotIcon,
  FileTextIcon,
  EyeIcon,
  ImageIcon,
  Settings2Icon,
  SparklesIcon,
  Trash2Icon,
  WifiIcon,
  WifiOffIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import { usePDFUtils } from "../common/use-pdf-utils.hooks";
import toolCatalogJson from "./tool-catalog.json";
import { ChatSessionProvider, useChatSession } from "./chat-session-context";
import { ChatWindow } from "./components/chat-window";
import { InputBar } from "./components/input-bar";
import type { ImageInput } from "../common/types";

type ExtractedPage = {
  pageNumber: number;
  text: string;
  lines: Array<{ text: string }>;
  imageNames?: string[];
};

type ExtractWorkerProgress = {
  type: "progress";
  currentPage: number;
  totalPages: number;
  message: string;
  progress: number;
};

type ExtractWorkerDone = {
  type: "done";
  pages: ExtractedPage[];
  assets: Array<{ name: string; page: number; mime: string; buffer: ArrayBuffer }>;
};

type PdfChunk = {
  id: string;
  text: string;
  pageStart: number;
  pageEnd: number;
  sourceFile: string;
};

type AssetPreview = {
  name: string;
  page: number;
  mime: string;
  url: string;
};

type RawAsset = {
  name: string;
  page: number;
  mime: string;
  buffer: ArrayBuffer;
};

type ExtractedDocument = {
  fileId: string;
  fileName: string;
  pages: ExtractedPage[];
  chunks: PdfChunk[];
  words: number;
  imageCount: number;
  assets: AssetPreview[];
};

type OcrMode = "speed" | "balanced" | "accuracy" | "rigorous";

type ContentTab = "pages" | "images";

type ChatSettings = {
  provider: "ollama" | "openai" | "gemini";
  model: string;
  apiKey: string;
  baseURL: string;
};

type ToolAction =
  | "merge-pdf"
  | "split-pdf"
  | "compress-pdf"
  | "rotate-pdf"
  | "crop-pdf"
  | "watermark-pdf"
  | "lock-pdf"
  | "unlock-pdf"
  | "page-numbers"
  | "organize-pdf"
  | "image-to-pdf"
  | "extract-content"
  | "edit-pdf";

type ExecutableToolAction = "merge-pdf" | "split-pdf" | "compress-pdf" | "rotate-pdf" | "image-to-pdf";

type ToolControl = {
  key: string;
  type: string;
  required: boolean;
  description: string;
};

type ToolSchema = {
  name: ToolAction;
  label: string;
  description: string;
  inputCardinality: { min: number; max: number | null };
  acceptedFileTypes: string[];
  aliases: string[];
  executableInChatPdf: boolean;
  controls: ToolControl[];
};

type ToolPlan = {
  tool: ExecutableToolAction;
  schema: ToolSchema;
  query: string;
  interpreted: Record<string, unknown>;
  controlValues: Array<{ key: string; value: string }>;
};

const SETTINGS_STORAGE_KEY = "chat-pdf-settings-v1";

const MODEL_OPTIONS: Record<ChatSettings["provider"], Array<{ id: string; name: string }>> = {
  ollama: [
    { id: "llama3:8b", name: "Llama3 8B" },
    { id: "llama3.2", name: "Llama3.2" },
  ],
  openai: [{ id: "gpt-4o-mini", name: "GPT-4o mini" }],
  gemini: [{ id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" }],
};

const TOOL_CATALOG = toolCatalogJson as ToolSchema[];
const TOOL_CATALOG_MAP = new Map<ToolAction, ToolSchema>(
  TOOL_CATALOG.map((tool) => [tool.name, tool]),
);
const EXECUTABLE_TOOLS = TOOL_CATALOG.filter(
  (tool): tool is ToolSchema & { name: ExecutableToolAction } => tool.executableInChatPdf,
);

function detectToolFromQuery(query: string): ToolAction | null {
  const q = query.toLowerCase();
  for (const tool of TOOL_CATALOG) {
    if (tool.aliases.some((alias) => q.includes(alias.toLowerCase()))) {
      return tool.name;
    }
  }
  return null;
}

function isExecutableTool(tool: ToolAction): tool is ExecutableToolAction {
  return EXECUTABLE_TOOLS.some((entry) => entry.name === tool);
}

function parseOutputName(query: string, fallbackName: string) {
  const match =
    query.match(/\bas\s+([a-zA-Z0-9._-]+\.pdf)\b/i) ||
    query.match(/\bto\s+([a-zA-Z0-9._-]+\.pdf)\b/i) ||
    query.match(/\bname\s+([a-zA-Z0-9._-]+\.pdf)\b/i);
  return (match?.[1] || fallbackName).trim();
}

function parseRangesFromQuery(query: string): string[] {
  const match = query.match(/(\d+\s*-\s*\d+)|(\d+)/g) || [];
  const ranges = match.map((m) => m.replace(/\s+/g, ""));
  return ranges.length > 0 ? ranges : ["1-1"];
}

function toPageGroupsFromRanges(ranges: string[], totalPages: number): number[][] {
  const groups: number[][] = [];
  for (const token of ranges) {
    if (!token.includes("-")) {
      const page = Number(token);
      if (Number.isFinite(page) && page >= 1 && page <= totalPages) {
        groups.push([page - 1, page - 1]);
      }
      continue;
    }
    const [startRaw, endRaw] = token.split("-");
    const start = Number(startRaw);
    const end = Number(endRaw);
    if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
    const safeStart = Math.max(1, Math.min(start, end));
    const safeEnd = Math.min(totalPages, Math.max(start, end));
    if (safeStart <= safeEnd) groups.push([safeStart - 1, safeEnd - 1]);
  }
  return groups.length > 0 ? groups : [[0, 0]];
}

function makeChunksFromPages(
  pages: ExtractedPage[],
  sourceFile: string,
  chunkSize = 1600,
  overlap = 220,
): PdfChunk[] {
  const chunks: PdfChunk[] = [];
  let chunkIndex = 1;

  for (const page of pages) {
    const baseText =
      (page.text || "").trim() ||
      page.lines.map((line) => line.text || "").join(" ").trim();
    if (!baseText) continue;

    let cursor = 0;
    while (cursor < baseText.length) {
      const slice = baseText.slice(cursor, cursor + chunkSize).trim();
      if (!slice) break;
      chunks.push({
        id: `${sourceFile}-p${page.pageNumber}-c${chunkIndex++}`,
        text: slice,
        pageStart: page.pageNumber,
        pageEnd: page.pageNumber,
        sourceFile,
      });
      cursor += Math.max(1, chunkSize - overlap);
    }
  }

  return chunks;
}

function countWords(pages: ExtractedPage[]): number {
  const text = pages
    .map((page) => page.text || page.lines.map((line) => line.text).join(" "))
    .join(" ");
  return text.split(/\s+/).filter(Boolean).length;
}

function inferPageFromAssetName(name: string): number {
  const match = name.match(/(\d{1,6})/);
  return match ? Number(match[1]) : 0;
}

function ChatPdfScreen() {
  const {
    files,
    fileInputRef,
    handleFileUpload,
    triggerFileInput,
    resetInput,
  } = useFileUpload((incoming) =>
    Array.from(incoming).filter((file) => file.type === "application/pdf"),
  );
  const [, pdfUtils] = usePDFUtils();

  const {
    messages,
    status,
    isStreaming,
    isContextSyncing,
    lastError,
    sendUserMessage,
    addLocalAssistantMessage,
    addLocalUserMessage,
    clearMessages,
    setSessionContext,
    reconnect,
  } = useChatSession();

  const [useOcrFallback, setUseOcrFallback] = useState(true);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractProgress, setExtractProgress] = useState(0);
  const [extractMessage, setExtractMessage] = useState("Waiting for upload...");
  const [currentFileName, setCurrentFileName] = useState("");
  const [documents, setDocuments] = useState<ExtractedDocument[]>([]);

  const [showContentDialog, setShowContentDialog] = useState(false);
  const [contentTab, setContentTab] = useState<ContentTab>("pages");
  const [contentFileId, setContentFileId] = useState<string | null>(null);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showToolsDialog, setShowToolsDialog] = useState(false);
  const [showToolConfirmDialog, setShowToolConfirmDialog] = useState(false);
  const [selectedTool, setSelectedTool] = useState<ExecutableToolAction>("merge-pdf");
  const [toolQuery, setToolQuery] = useState("");
  const [toolPlan, setToolPlan] = useState<ToolPlan | null>(null);
  const [selectedToolFileIds, setSelectedToolFileIds] = useState<string[]>([]);
  const [toolOutputName, setToolOutputName] = useState("");
  const [toolSplitRanges, setToolSplitRanges] = useState("1-1");
  const [toolCompressMode, setToolCompressMode] = useState<"relaxed" | "strict">("relaxed");
  const [toolRotation, setToolRotation] = useState("90");
  const [toolRotateRanges, setToolRotateRanges] = useState("");
  const [toolImagePageSize, setToolImagePageSize] = useState<"a4" | "natural" | "us-letter">("a4");
  const [toolImageMargin, setToolImageMargin] = useState<"none" | "small" | "large">("small");

  const [settings, setSettings] = useState<ChatSettings>({
    provider: "ollama",
    model: "llama3:8b",
    apiKey: "",
    baseURL: "http://127.0.0.1:11434",
  });
  const [settingsSaved, setSettingsSaved] = useState(false);

  const [input, setInput] = useState("");

  const autoExtractKeyRef = useRef("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ChatSettings;
      if (!parsed || !parsed.provider || !parsed.model) return;
      setSettings(parsed);
      setSettingsSaved(true);
    } catch {
      // Ignore invalid storage.
    }
  }, []);

  const stats = useMemo(() => {
    const pages = documents.reduce((sum, doc) => sum + doc.pages.length, 0);
    const words = documents.reduce((sum, doc) => sum + doc.words, 0);
    const images = documents.reduce((sum, doc) => sum + doc.imageCount, 0);
    const chunks = documents.reduce((sum, doc) => sum + doc.chunks.length, 0);
    const tokenEstimate = Math.ceil(words * 1.33);
    return { pages, words, images, chunks, tokenEstimate };
  }, [documents]);

  const extracted = documents.length > 0 && !isExtracting;

  const disableActions = isExtracting || isContextSyncing;

  const runExtraction = useCallback(
    async (options: { useOcr: boolean; mode: OcrMode }) => {
      if (files.length === 0) return;

      setIsExtracting(true);
      setExtractProgress(0);
      setExtractMessage("Starting extraction...");
      setCurrentFileName("");
      setDocuments([]);

      addLocalUserMessage(
        `Uploaded ${files.length} PDF${files.length > 1 ? "s" : ""}:\n${files
          .map((file) => `• ${file.name}`)
          .join("\n")}`,
      );
      addLocalAssistantMessage("Got it. I am extracting text and images now.");

      const nextDocs: ExtractedDocument[] = [];

      try {
        for (let index = 0; index < files.length; index++) {
          const uploaded = files[index];
          setCurrentFileName(uploaded.name);

          const raw = await uploaded.file.arrayBuffer();
          const rawForWorker = raw.slice(0);
          const rawForTrusted = raw.slice(0);
          const worker = new Worker(
            new URL("../extract-content/extract.worker.ts", import.meta.url),
            { type: "module" },
          );

          const workerPromise = new Promise<ExtractWorkerDone>((resolve, reject) => {
            worker.onmessage = (event: MessageEvent<any>) => {
              const data = event.data;
              if (!data || typeof data !== "object") return;
              if (data.type === "progress") {
                const p = data as ExtractWorkerProgress;
                const perFile = Math.max(0, Math.min(100, p.progress || 0));
                const overall = ((index + perFile / 100) / files.length) * 100;
                setExtractProgress(overall);
                setExtractMessage(`${p.message} (${p.currentPage}/${p.totalPages})`);
                return;
              }
              if (data.type === "done") {
                resolve(data as ExtractWorkerDone);
                return;
              }
              if (data.type === "error") {
                reject(new Error(String(data.error || "Extraction failed")));
              }
            };
            worker.onerror = (event) => reject(new Error(event.message || "Extraction worker failed"));

            worker.postMessage(
              {
                type: "extract",
                fileBuffer: rawForWorker,
                useOcrFallback: options.useOcr,
                ocrMode: options.mode,
              },
              [rawForWorker],
            );
          });

          const trustedAssetsPromise = pdfUtils
            .extractImages(
              {
                id: uploaded.id,
                buffer: rawForTrusted,
              },
              { skipLikelyMaskAssets: true },
            )
            .then((extracted) =>
              extracted.map((asset): RawAsset => {
                const lower = asset.path.toLowerCase();
                const mime = lower.endsWith(".jpg") || lower.endsWith(".jpeg")
                  ? "image/jpeg"
                  : lower.endsWith(".webp")
                    ? "image/webp"
                    : "image/png";
                const name = asset.path.split("/").pop() || "asset.png";
                return {
                  name,
                  page: inferPageFromAssetName(name),
                  mime,
                  buffer: asset.buffer,
                };
              }),
            )
            .catch((error) => {
              console.warn("[chat-pdf] trusted image extraction failed", error);
              return [] as RawAsset[];
            });

          const [result, trustedAssets] = await Promise.all([
            workerPromise,
            trustedAssetsPromise,
          ]).finally(() => worker.terminate());

          const workerAssets = result.assets || [];
          console.info("[chat-pdf] asset counts", {
            trusted: trustedAssets.length,
            worker: workerAssets.length,
          });

          const finalAssetsRaw = (trustedAssets.length > 0 ? trustedAssets : workerAssets) as RawAsset[];
          const seen = new Set<string>();
          const uniqueAssets = finalAssetsRaw.filter((asset) => {
            const key = `${asset.name}:${asset.buffer.byteLength}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });

          const assets: AssetPreview[] = uniqueAssets.map((asset) => {
            const blob = new Blob([asset.buffer], {
              type: asset.mime || "application/octet-stream",
            });
            return {
              name: asset.name,
              page: asset.page,
              mime: asset.mime,
              url: URL.createObjectURL(blob),
            };
          });

          const pages = result.pages || [];
          const words = countWords(pages);

          nextDocs.push({
            fileId: uploaded.id,
            fileName: uploaded.name,
            pages,
            chunks: makeChunksFromPages(pages, uploaded.id),
            words,
            imageCount: assets.length,
            assets,
          });
        }

        setDocuments(nextDocs);
        setExtractProgress(100);
        setExtractMessage("Extraction complete");

        const totalPages = nextDocs.reduce((sum, doc) => sum + doc.pages.length, 0);
        const totalChunks = nextDocs.reduce((sum, doc) => sum + doc.chunks.length, 0);
        const totalWords = nextDocs.reduce((sum, doc) => sum + doc.words, 0);
        const totalImages = nextDocs.reduce((sum, doc) => sum + doc.imageCount, 0);
        const tokenEstimate = Math.ceil(totalWords * 1.33);

        addLocalAssistantMessage(
          `Extraction complete.\nPages: ${totalPages}\nChunks: ${totalChunks}\nWords: ${totalWords}\nTokens(est): ${tokenEstimate}\nImages: ${totalImages}`,
        );

        if (!settingsSaved) {
          setShowSettingsDialog(true);
          addLocalAssistantMessage("Before chat starts, configure your model access in Settings.");
        }

        setSessionContext({
          chunks: nextDocs.flatMap((doc) => doc.chunks).slice(0, 1500),
          stats: {
            pages: totalPages,
            chunks: totalChunks,
            words: totalWords,
            tokens: tokenEstimate,
            images: totalImages,
          },
          files: nextDocs.map((doc) => ({
            id: doc.fileId,
            name: doc.fileName,
            pages: doc.pages.length,
            images: doc.imageCount,
          })),
          extraction: {
            ocrEnabled: options.useOcr,
            mode: options.mode,
          },
          tools: TOOL_CATALOG.map((tool) => ({
            name: tool.name,
            description: tool.description,
            controls: tool.controls.map((control) => ({
              key: control.key,
              type: control.type,
              required: control.required,
            })),
            executableInChatPdf: tool.executableInChatPdf,
          })),
          llm: settings,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        toast.error(`Extraction failed: ${message}`);
        setExtractMessage("Extraction failed");
        setExtractProgress(0);
        addLocalAssistantMessage(`Extraction failed: ${message}`);
      } finally {
        setIsExtracting(false);
        setCurrentFileName("");
      }
    },
    [addLocalAssistantMessage, addLocalUserMessage, files, setSessionContext, settings, settingsSaved],
  );

  useEffect(() => {
    if (!files.length) return;
    const key = `${files.map((file) => file.id).join(",")}|${useOcrFallback ? "ocr" : "no-ocr"}`;
    if (key === autoExtractKeyRef.current || isExtracting) return;
    autoExtractKeyRef.current = key;
    runExtraction({ useOcr: useOcrFallback, mode: "balanced" }).catch(() => undefined);
  }, [files, isExtracting, runExtraction, useOcrFallback]);

  useEffect(() => {
    return () => {
      documents.forEach((doc) => {
        doc.assets.forEach((asset) => URL.revokeObjectURL(asset.url));
      });
    };
  }, [documents]);

  useEffect(() => {
    const schema = TOOL_CATALOG_MAP.get(selectedTool);
    if (!schema) return;
    if (schema.inputCardinality.max === 1) {
      setSelectedToolFileIds(files[0] ? [files[0].id] : []);
      return;
    }
    setSelectedToolFileIds(files.map((file) => file.id));
  }, [files, selectedTool]);

  const makeToolPlan = useCallback((queryInput: string, preferredTool?: ExecutableToolAction): ToolPlan | null => {
    const query = queryInput.trim();
    if (!files.length) {
      toast.error("Upload at least one PDF first.");
      return null;
    }

    const autoDetected = detectToolFromQuery(query);
    const toolCandidate = preferredTool || (autoDetected && isExecutableTool(autoDetected) ? autoDetected : null) || selectedTool;
    const tool = toolCandidate as ExecutableToolAction;
    const schema = TOOL_CATALOG_MAP.get(tool);
    if (!schema) {
      toast.error(`Tool schema missing for ${tool}`);
      return null;
    }
    const selectedFiles = files.filter((file) => selectedToolFileIds.includes(file.id));
    if (schema.inputCardinality.max === 1 && selectedFiles.length !== 1) {
      toast.error("Select exactly one file for this tool.");
      return null;
    }
    if (schema.inputCardinality.min > 1 && selectedFiles.length < schema.inputCardinality.min) {
      toast.error(`Select at least ${schema.inputCardinality.min} files for this tool.`);
      return null;
    }

    if (tool === "merge-pdf") {
      const outputName = (toolOutputName || parseOutputName(query, "merged.pdf")).trim();
      const interpreted = {
        selectedFileIds: selectedFiles.map((file) => file.id),
        filesCount: selectedFiles.length,
        outputName,
      };
      return {
        tool,
        schema,
        query,
        interpreted,
        controlValues: [
          { key: "files", value: selectedFiles.map((f) => f.name).join(", ") || "-" },
          { key: "outputName", value: outputName },
        ],
      };
    }

    if (tool === "split-pdf") {
      const source = selectedFiles[0];
      const sourceDoc = documents.find((doc) => doc.fileId === source?.id);
      const totalPages = sourceDoc?.pages.length || 1;
      const ranges = parseRangesFromQuery(toolSplitRanges || query || "1-1");
      const outputName = (toolOutputName || parseOutputName(query, ranges.length > 1 ? "split.zip" : "split.pdf")).trim();
      const interpreted = {
        sourceFileId: source?.id || "",
        sourceFile: source?.name || "",
        totalPages,
        ranges,
        outputName,
      };
      return {
        tool,
        schema,
        query,
        interpreted,
        controlValues: [
          { key: "file", value: source?.name || "-" },
          { key: "ranges", value: ranges.join(", ") },
          { key: "outputName", value: outputName },
        ],
      };
    }

    if (tool === "compress-pdf") {
      const source = selectedFiles[0];
      const mode = toolCompressMode || (/strict|smallest|tiny/i.test(query) ? "strict" : "relaxed");
      const outputName = (toolOutputName || parseOutputName(query, "compressed.pdf")).trim();
      const interpreted = {
        sourceFileId: source?.id || "",
        sourceFile: source?.name || "",
        mode,
        outputName,
      };
      return {
        tool,
        schema,
        query,
        interpreted,
        controlValues: [
          { key: "file", value: source?.name || "-" },
          { key: "mode", value: mode },
          { key: "outputName", value: outputName },
        ],
      };
    }

    if (tool === "image-to-pdf") {
      const pageSize = toolImagePageSize;
      const margin = toolImageMargin;
      const outputName = (toolOutputName || parseOutputName(query, "images-to-pdf.pdf")).trim();
      const selectedDocIds = selectedFiles.map((file) => file.id);
      const assetCount = documents
        .filter((doc) => selectedDocIds.includes(doc.fileId))
        .reduce((sum, doc) => sum + doc.assets.length, 0);
      const interpreted = {
        sourceFileIds: selectedDocIds,
        assetCount,
        pageSize,
        margin,
        outputName,
      };
      return {
        tool,
        schema,
        query,
        interpreted,
        controlValues: [
          { key: "assets", value: `${assetCount} extracted images` },
          { key: "pageSize", value: pageSize },
          { key: "margin", value: margin },
          { key: "outputName", value: outputName },
        ],
      };
    }

    const source = selectedFiles[0];
    const rotationMatch = toolRotation.match(/-?\d+/) || query.match(/(-?270|-?180|-?90|270|180|90)/);
    const rotation = rotationMatch ? Number(rotationMatch[0]) : 90;
    const ranges = toolRotateRanges ? parseRangesFromQuery(toolRotateRanges) : (/page/i.test(query) ? parseRangesFromQuery(query) : []);
    const outputName = (toolOutputName || parseOutputName(query, "rotated.pdf")).trim();
    const interpreted = {
      sourceFileId: source?.id || "",
      sourceFile: source?.name || "",
      rotation,
      pages: ranges,
      outputName,
    };
    return {
      tool,
      schema,
      query,
      interpreted,
      controlValues: [
        { key: "file", value: source?.name || "-" },
        { key: "rotation", value: String(rotation) },
        { key: "pages", value: ranges.length ? ranges.join(", ") : "all" },
        { key: "outputName", value: outputName },
      ],
    };
  }, [documents, files, selectedTool, selectedToolFileIds, toolCompressMode, toolImageMargin, toolImagePageSize, toolOutputName, toolRotateRanges, toolRotation, toolSplitRanges]);

  const send = useCallback(() => {
    const prompt = input.trim();
    if (!prompt) return;
    if (!extracted) {
      toast.error("Wait for extraction to finish before chatting.");
      return;
    }
    if (!settingsSaved || isContextSyncing) {
      setShowSettingsDialog(true);
      toast.error("Context and settings are still preparing.");
      return;
    }

    const detectedTool = detectToolFromQuery(prompt);
    if (detectedTool) {
      if (!isExecutableTool(detectedTool)) {
        addLocalAssistantMessage(
          `I detected the "${detectedTool}" tool from your message. It is listed in the catalog but not yet executable inside Chat PDF.`,
        );
        setInput("");
        return;
      }
      const plan = makeToolPlan(prompt, detectedTool);
      if (plan) {
        setSelectedTool(detectedTool);
        setToolPlan(plan);
        setShowToolConfirmDialog(true);
        return;
      }
    }

    setInput("");
    sendUserMessage(prompt);
  }, [addLocalAssistantMessage, extracted, input, isContextSyncing, makeToolPlan, sendUserMessage, settingsSaved]);

  const executeToolPlan = useCallback(async () => {
    if (!toolPlan) return;

    if (toolPlan.tool === "merge-pdf") {
      const { PDFDocument } = await import("pdf-lib");
      const selectedIds = Array.isArray(toolPlan.interpreted.selectedFileIds)
        ? (toolPlan.interpreted.selectedFileIds as string[])
        : files.map((file) => file.id);
      const selectedFiles = files.filter((file) => selectedIds.includes(file.id));
      if (selectedFiles.length < 2) {
        throw new Error("Select at least 2 files to merge.");
      }
      const outDoc = await PDFDocument.create();
      for (const uploaded of selectedFiles) {
        const bytes = await uploaded.file.arrayBuffer();
        const src = await PDFDocument.load(bytes);
        const indices = src.getPageIndices();
        const copied = await outDoc.copyPages(src, indices);
        copied.forEach((page) => outDoc.addPage(page));
      }
      const mergedBytes = await outDoc.save();
      const blob = new Blob([mergedBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = String(toolPlan.interpreted.outputName || "merged.pdf");
      a.click();
      URL.revokeObjectURL(url);
      addLocalAssistantMessage("Merge completed and downloaded.");
      return;
    }

    const sourceId = String(toolPlan.interpreted.sourceFileId || "");
    const source = files.find((file) => file.id === sourceId) || files[0];
    if (!source) throw new Error("No PDF file available.");

    if (toolPlan.tool === "split-pdf") {
      const ranges = Array.isArray(toolPlan.interpreted.ranges)
        ? (toolPlan.interpreted.ranges as string[])
        : ["1-1"];
      const totalPages = Number(toolPlan.interpreted.totalPages || 1);
      const splitGroups = toPageGroupsFromRanges(ranges, Math.max(1, totalPages));
      const sourceBytes = await source.file.arrayBuffer();
      const outputs = await pdfUtils.split(
        { id: source.id, buffer: sourceBytes },
        splitGroups,
      );
      if (!outputs.length) throw new Error("No split output generated.");

      if (outputs.length === 1) {
        const blob = new Blob([outputs[0]], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = String(toolPlan.interpreted.outputName || "split.pdf");
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const JSZip = (await import("jszip")).default;
        const zip = new JSZip();
        outputs.forEach((part, index) => {
          zip.file(`split_${index + 1}.pdf`, part);
        });
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement("a");
        a.href = url;
        const out = String(toolPlan.interpreted.outputName || "split.zip").replace(/\.pdf$/i, ".zip");
        a.download = out;
        a.click();
        URL.revokeObjectURL(url);
      }
      addLocalAssistantMessage("Split completed and downloaded.");
      return;
    }

    if (toolPlan.tool === "compress-pdf") {
      const mode = String(toolPlan.interpreted.mode || "relaxed") === "strict" ? "strict" : "relaxed";
      const sourceBytes = await source.file.arrayBuffer();
      const result = await pdfUtils.compress({ id: source.id, buffer: sourceBytes }, { mode });
      const blob = new Blob([result], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = String(toolPlan.interpreted.outputName || "compressed.pdf");
      a.click();
      URL.revokeObjectURL(url);
      addLocalAssistantMessage(`Compression (${mode}) completed and downloaded.`);
      return;
    }

    if (toolPlan.tool === "image-to-pdf") {
      const selectedIds = Array.isArray(toolPlan.interpreted.sourceFileIds)
        ? (toolPlan.interpreted.sourceFileIds as string[])
        : files.map((file) => file.id);
      const allExtractedAssets = documents
        .filter((doc) => selectedIds.includes(doc.fileId))
        .flatMap((doc) => doc.assets);
      if (allExtractedAssets.length === 0) {
        throw new Error("No extracted images available. Upload a PDF with embedded images first.");
      }

      const images: ImageInput[] = [];
      for (const asset of allExtractedAssets) {
        if (!asset.mime.includes("png") && !asset.mime.includes("jpeg") && !asset.mime.includes("jpg")) {
          continue;
        }
        const response = await fetch(asset.url);
        const buffer = await response.arrayBuffer();
        images.push({
          buffer,
          type: asset.mime.includes("png") ? "image/png" : "image/jpeg",
        });
      }

      if (images.length === 0) {
        throw new Error("No PNG/JPEG assets available to build PDF.");
      }

      const pageSize = String(toolPlan.interpreted.pageSize || "a4") as "a4" | "natural" | "us-letter";
      const margin = String(toolPlan.interpreted.margin || "small") as "none" | "small" | "large";
      const result = await pdfUtils.embedImages(images, {
        orientation: "portrait",
        pageSize,
        margin,
      });
      const blob = new Blob([result], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = String(toolPlan.interpreted.outputName || "images-to-pdf.pdf");
      a.click();
      URL.revokeObjectURL(url);
      addLocalAssistantMessage(`Image to PDF completed with ${images.length} images.`);
      return;
    }

    const rotation = Number(toolPlan.interpreted.rotation || 90);
    const ranges = Array.isArray(toolPlan.interpreted.pages)
      ? (toolPlan.interpreted.pages as string[])
      : [];
    const sourceDoc = documents.find((doc) => doc.fileId === source.id);
    const totalPages = sourceDoc?.pages.length || 1;
    const groups = ranges.length > 0 ? toPageGroupsFromRanges(ranges, totalPages) : [];
    const pageSet = new Set<number>();
    groups.forEach(([start, end]) => {
      for (let p = start; p <= end; p++) pageSet.add(p);
    });
    const pageList = pageSet.size ? Array.from(pageSet).sort((a, b) => a - b) : undefined;
    const sourceBytes = await source.file.arrayBuffer();
    const result = await pdfUtils.rotate(sourceBytes, { rotation, pages: pageList });
    const blob = new Blob([result], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = String(toolPlan.interpreted.outputName || "rotated.pdf");
    a.click();
    URL.revokeObjectURL(url);
    addLocalAssistantMessage("Rotation completed and downloaded.");
  }, [addLocalAssistantMessage, documents, files, pdfUtils, toolPlan]);

  const clearAll = useCallback(() => {
    documents.forEach((doc) => {
      doc.assets.forEach((asset) => URL.revokeObjectURL(asset.url));
    });
    resetInput();
    clearMessages();
    setDocuments([]);
    setExtractProgress(0);
    setExtractMessage("Waiting for upload...");
    setCurrentFileName("");
    setInput("");
    autoExtractKeyRef.current = "";
  }, [clearMessages, documents, resetInput]);

  const previewRows = useMemo(() => {
    return documents
      .filter((doc) => !contentFileId || doc.fileId === contentFileId)
      .flatMap((doc) =>
      doc.pages.map((page) => {
        const assetsForPage = doc.assets.filter(
          (asset) => asset.page === page.pageNumber || (page.imageNames || []).includes(asset.name),
        );

        return {
          id: `${doc.fileId}-p${page.pageNumber}`,
          fileName: doc.fileName,
          pageNumber: page.pageNumber,
          text: (page.text || page.lines.map((line) => line.text).join(" ")).slice(0, 3500),
          assets: assetsForPage,
        };
      }),
    );
  }, [contentFileId, documents]);

  const allAssets = useMemo(() => {
    return documents
      .filter((doc) => !contentFileId || doc.fileId === contentFileId)
      .flatMap((doc) =>
      doc.assets.map((asset) => ({ ...asset, fileName: doc.fileName })),
    );
  }, [contentFileId, documents]);

  const imageRows = useMemo(() => {
    const cols = 3;
    const rows: Array<Array<(typeof allAssets)[number]>> = [];
    for (let i = 0; i < allAssets.length; i += cols) {
      rows.push(allAssets.slice(i, i + cols));
    }
    return rows;
  }, [allAssets]);

  const contentStats = useMemo(() => {
    const sourceDocs = contentFileId
      ? documents.filter((doc) => doc.fileId === contentFileId)
      : documents;
    return {
      pages: sourceDocs.reduce((sum, doc) => sum + doc.pages.length, 0),
      images: sourceDocs.reduce((sum, doc) => sum + doc.imageCount, 0),
    };
  }, [contentFileId, documents]);

  const dialogParentRef = useRef<HTMLDivElement | null>(null);
  const pageVirtualizer = useVirtualizer({
    count: previewRows.length,
    getScrollElement: () => dialogParentRef.current,
    estimateSize: () => 520,
    overscan: 4,
  });

  const imageParentRef = useRef<HTMLDivElement | null>(null);
  const imageVirtualizer = useVirtualizer({
    count: imageRows.length,
    getScrollElement: () => imageParentRef.current,
    estimateSize: () => 220,
    overscan: 4,
  });

  if (files.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center p-4 sm:p-6 bg-background">
        <UploadButtonFull
          multiple
          accept="application/pdf"
          title="Chat with your PDFs"
          subtitle="Chat with PDFs and utilse a suite of PDF tools."
          label="Upload PDF files"
          fileInputRef={fileInputRef}
          handleFileUpload={handleFileUpload}
          triggerFileInput={triggerFileInput}
        />
      </div>
    );
  }

  const connected = status === "open";

  return (
    <div className="h-full p-3 sm:p-5 bg-background">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="application/pdf"
        className="hidden"
        onChange={handleFileUpload}
      />

      <div className="h-full rounded-2xl border border-border bg-white dark:bg-card shadow-sm flex flex-col overflow-hidden">
        <div className="border-b border-border px-3 py-2.5 sm:px-4 sm:py-3 flex items-center gap-3">
          <Avatar className="h-8 w-8 border border-border bg-secondary text-primary">
            <AvatarFallback>
              <BotIcon className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">Chat PDF</p>
            <p className="text-xs text-muted-foreground truncate">
              {files.length} file{files.length > 1 ? "s" : ""} inputted
            </p>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 text-xs ${connected ? "text-emerald-600" : "text-destructive"}`}>
              {connected ? <WifiIcon className="h-3.5 w-3.5" /> : <WifiOffIcon className="h-3.5 w-3.5" />}
              {connected ? "Connected" : "Disconnected"}
            </span>
            <Button variant="outline" size="icon" onClick={() => setShowSettingsDialog(true)} disabled={disableActions}>
              <Settings2Icon className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={clearAll} disabled={disableActions}>
              <Trash2Icon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="border-b border-border px-3 py-2 flex gap-2 overflow-x-auto">
          {files.map((entry) => (
            <div key={entry.id} className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1">
              {entry.file.type.startsWith("image/") ? (
                <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <FileTextIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <span className="w-44 truncate text-xs">{entry.file.name}</span>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-6 w-6 shrink-0"
                onClick={() => {
                  setContentTab("pages");
                  setContentFileId(entry.id);
                  setShowContentDialog(true);
                }}
                disabled={disableActions}
                aria-label={`View content for ${entry.file.name}`}
              >
                <EyeIcon className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>

        {isExtracting ? (
          <div className="px-4 py-2 border-b border-border text-xs text-muted-foreground bg-muted/30">
            Extracting {currentFileName ? `from ${currentFileName}` : "PDF"}: {extractMessage} ({Math.round(extractProgress)}%)
          </div>
        ) : null}

        {lastError ? (
          <div className="px-4 py-2 border-b border-border text-xs text-destructive bg-destructive/10">
            {lastError} <button className="underline ml-2" onClick={reconnect}>Reconnect</button>
            <span className="ml-3 text-muted-foreground">Start server: <code>npm run chat:ws</code></span>
          </div>
        ) : null}

        <ChatWindow messages={messages} isStreaming={isStreaming} />

        <div className="border-t border-border p-3 sm:p-4 bg-muted/40">
          <InputBar
            value={input}
            onChange={setInput}
            onSubmit={send}
            onAttach={triggerFileInput}
            onTools={() => setShowToolsDialog(true)}
            files={[]}
            inputDisabled={!extracted || !settingsSaved || disableActions}
            sendDisabled={!extracted || !settingsSaved || !input.trim() || disableActions}
            attachDisabled={disableActions}
            isSending={status === "connecting" || status === "reconnecting"}
            ready={extracted && settingsSaved && !disableActions}
            statusText={
              isExtracting
                ? `Processing ${currentFileName || "PDF"} (${Math.round(extractProgress)}%)`
                : isContextSyncing
                  ? "Syncing extracted context with chat backend..."
                  : !settingsSaved
                    ? "Save settings to enable chat input."
                    : undefined
            }
          />
        </div>
      </div>

      {showToolsDialog ? (
        <div className="fixed inset-0 z-50 bg-foreground/45 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <p className="text-sm font-semibold">PDF Tools</p>
              <Button size="icon" variant="ghost" onClick={() => setShowToolsDialog(false)} aria-label="Close tools dialog">
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 space-y-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Tool</p>
                <Select value={selectedTool} onValueChange={(value) => setSelectedTool(value as ExecutableToolAction)}>
                  <SelectTrigger><SelectValue placeholder="Select tool" /></SelectTrigger>
                  <SelectContent>
                    {EXECUTABLE_TOOLS.map((tool) => (
                      <SelectItem key={tool.name} value={tool.name}>
                        {tool.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Input files</p>
                {(() => {
                  const schema = TOOL_CATALOG_MAP.get(selectedTool);
                  if (!schema) return null;
                  const single = schema.inputCardinality.max === 1;
                  return (
                    <div className="max-h-40 overflow-auto rounded-md border border-border p-2 space-y-1">
                      {files.map((file) => {
                        const selected = selectedToolFileIds.includes(file.id);
                        return (
                          <button
                            key={file.id}
                            type="button"
                            className={`w-full text-left text-xs px-2 py-1.5 rounded border ${selected ? "border-primary bg-primary/10" : "border-transparent hover:bg-muted"}`}
                            onClick={() => {
                              if (single) {
                                setSelectedToolFileIds([file.id]);
                                return;
                              }
                              setSelectedToolFileIds((prev) =>
                                prev.includes(file.id) ? prev.filter((id) => id !== file.id) : [...prev, file.id],
                              );
                            }}
                          >
                            {file.name}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
              {selectedTool !== "merge-pdf" ? (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Instruction (optional, falls back to chat input)</p>
                <Input
                  value={toolQuery}
                  onChange={(e) => setToolQuery(e.target.value)}
                  placeholder={
                    selectedTool === "split-pdf"
                        ? "split pages 1-3, 8-10 as chapter-a.pdf"
                        : selectedTool === "compress-pdf"
                          ? "compress strict as compact.pdf"
                          : selectedTool === "image-to-pdf"
                            ? "convert extracted images to pdf as assets-pack.pdf"
                            : "rotate 90 page 2-5 as rotated.pdf"
                  }
                />
              </div>
              ) : null}
              {selectedTool === "split-pdf" ? (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Page ranges</p>
                  <Input value={toolSplitRanges} onChange={(e) => setToolSplitRanges(e.target.value)} placeholder="1-3, 8-10" />
                </div>
              ) : null}
              {selectedTool === "compress-pdf" ? (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Compression mode</p>
                  <Select value={toolCompressMode} onValueChange={(value) => setToolCompressMode(value as "relaxed" | "strict")}>
                    <SelectTrigger><SelectValue placeholder="Select mode" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relaxed">Relaxed</SelectItem>
                      <SelectItem value="strict">Strict</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              {selectedTool === "rotate-pdf" ? (
                <>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Rotation</p>
                    <Input value={toolRotation} onChange={(e) => setToolRotation(e.target.value)} placeholder="90" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Page ranges (optional)</p>
                    <Input value={toolRotateRanges} onChange={(e) => setToolRotateRanges(e.target.value)} placeholder="2-5" />
                  </div>
                </>
              ) : null}
              {selectedTool === "image-to-pdf" ? (
                <>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Page size</p>
                    <Select value={toolImagePageSize} onValueChange={(value) => setToolImagePageSize(value as "a4" | "natural" | "us-letter")}>
                      <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="a4">A4</SelectItem>
                        <SelectItem value="natural">Natural</SelectItem>
                        <SelectItem value="us-letter">US Letter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Margins</p>
                    <Select value={toolImageMargin} onValueChange={(value) => setToolImageMargin(value as "none" | "small" | "large")}>
                      <SelectTrigger><SelectValue placeholder="Select margin" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : null}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Output file name (optional)</p>
                <Input value={toolOutputName} onChange={(e) => setToolOutputName(e.target.value)} placeholder="output.pdf" />
              </div>
            </div>
            <div className="px-4 py-3 border-t border-border">
              <Button
                className="w-full"
                onClick={() => {
                  const querySource = toolQuery.trim() || input.trim();
                  const autoTool = detectToolFromQuery(querySource);
                  const preferredTool = autoTool && isExecutableTool(autoTool) ? autoTool : selectedTool;
                  const plan = makeToolPlan(querySource, preferredTool);
                  if (!plan) return;
                  if (autoTool && isExecutableTool(autoTool)) setSelectedTool(autoTool);
                  setToolPlan(plan);
                  setShowToolsDialog(false);
                  setShowToolConfirmDialog(true);
                }}
                disabled={disableActions}
              >
                <SparklesIcon className="h-4 w-4 mr-1" />
                Review action
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {showToolConfirmDialog && toolPlan ? (
        <div className="fixed inset-0 z-50 bg-foreground/45 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <p className="text-sm font-semibold">Confirm Tool Action</p>
              <Button size="icon" variant="ghost" onClick={() => setShowToolConfirmDialog(false)} aria-label="Close confirmation dialog">
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <p className="text-xs text-muted-foreground">Tool</p>
              <p className="font-medium">{toolPlan.schema.label}</p>
              <p className="text-xs text-muted-foreground">Query</p>
              <p className="max-h-10 overflow-hidden text-ellipsis">{toolPlan.query}</p>
              <div className="rounded-md border border-border divide-y divide-border">
                {toolPlan.controlValues.map((entry) => (
                  <div key={entry.key} className="grid grid-cols-[120px_1fr] gap-2 px-3 py-2 text-xs">
                    <span className="text-muted-foreground">{entry.key}</span>
                    <span className="truncate" title={entry.value}>{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-4 py-3 border-t border-border flex items-center gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowToolConfirmDialog(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={async () => {
                  try {
                    await executeToolPlan();
                    setShowToolConfirmDialog(false);
                  } catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    toast.error(`Tool execution failed: ${message}`);
                  }
                }}
              >
                Confirm & Run
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {showSettingsDialog ? (
        <div className="fixed inset-0 z-50 bg-foreground/45 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <p className="text-sm font-semibold">Chat Settings</p>
              <Button size="icon" variant="ghost" onClick={() => setShowSettingsDialog(false)} aria-label="Close settings dialog">
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 space-y-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Provider</p>
                <Select
                  value={settings.provider}
                  onValueChange={(value) => {
                    const provider = value as ChatSettings["provider"];
                    setSettings((prev) => ({
                      ...prev,
                      provider,
                      model: MODEL_OPTIONS[provider][0].id,
                    }));
                    setSettingsSaved(false);
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ollama">Ollama (local)</SelectItem>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="gemini">Gemini</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Model</p>
                <Select
                  value={settings.model}
                  onValueChange={(value) => {
                    setSettings((prev) => ({ ...prev, model: value }));
                    setSettingsSaved(false);
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Select model" /></SelectTrigger>
                  <SelectContent>
                    {MODEL_OPTIONS[settings.provider].map((model) => (
                      <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">API Key (optional for local Ollama)</p>
                <Input
                  value={settings.apiKey}
                  onChange={(e) => {
                    setSettings((prev) => ({ ...prev, apiKey: e.target.value }));
                    setSettingsSaved(false);
                  }}
                  type="password"
                  placeholder="Paste your key"
                />
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Base URL</p>
                <Input
                  value={settings.baseURL}
                  onChange={(e) => {
                    setSettings((prev) => ({ ...prev, baseURL: e.target.value }));
                    setSettingsSaved(false);
                  }}
                  placeholder="http://127.0.0.1:11434"
                />
              </div>

              <a href="/login" className="text-xs underline text-primary">Login to use paid services</a>
            </div>
            <div className="px-4 py-3 border-t border-border">
              <Button
                className="w-full"
                onClick={() => {
                  setSettingsSaved(true);
                  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
                  setSessionContext({ llm: settings });
                  setShowSettingsDialog(false);
                  addLocalAssistantMessage("Settings saved. Input is now enabled.");
                }}
              >
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {showContentDialog ? (
        <div className="fixed inset-0 z-50 bg-foreground/45 flex items-center justify-center p-4">
          <div className="w-full max-w-6xl rounded-xl border border-border bg-card max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <p className="text-sm font-semibold">Extracted Content: {contentStats.pages} pages, {contentStats.images} images</p>
              <div className="flex items-center gap-2">
                <Select
                  value={contentFileId || "__all__"}
                  onValueChange={(value) => setContentFileId(value === "__all__" ? null : value)}
                >
                  <SelectTrigger className="h-8 w-[210px]">
                    <SelectValue placeholder="All files" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All files</SelectItem>
                    {documents.map((doc) => (
                      <SelectItem key={doc.fileId} value={doc.fileId}>
                        {doc.fileName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs">
                  <span>OCR</span>
                  <Switch
                    checked={useOcrFallback}
                    onCheckedChange={(checked) => setUseOcrFallback(checked)}
                    disabled={disableActions}
                    aria-label="Toggle OCR"
                  />
                </div>
                <Button variant={contentTab === "pages" ? "default" : "outline"} size="sm" onClick={() => setContentTab("pages")}>Pages</Button>
                <Button variant={contentTab === "images" ? "default" : "outline"} size="sm" onClick={() => setContentTab("images")}>Images</Button>
                <Button size="icon" variant="ghost" onClick={() => setShowContentDialog(false)} aria-label="Close content dialog">
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {contentTab === "pages" ? (
              <div ref={dialogParentRef} className="flex-1 overflow-auto">
                <div style={{ height: `${pageVirtualizer.getTotalSize()}px`, width: "100%", position: "relative" }}>
                  {pageVirtualizer.getVirtualItems().map((virtualItem) => {
                    const row = previewRows[virtualItem.index];
                    if (!row) return null;
                    return (
                      <div
                        key={row.id}
                        data-index={virtualItem.index}
                        ref={pageVirtualizer.measureElement}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          transform: `translateY(${virtualItem.start}px)`,
                        }}
                        className="p-3"
                      >
                        <section className="rounded-lg border border-border bg-background p-3 space-y-2">
                          <p className="font-medium text-sm">{row.fileName} · Page {row.pageNumber}</p>
                          <pre className="whitespace-pre-wrap text-xs leading-relaxed">{row.text}</pre>
                        </section>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div ref={imageParentRef} className="flex-1 overflow-auto p-3">
                <div style={{ height: `${imageVirtualizer.getTotalSize()}px`, width: "100%", position: "relative" }}>
                  {imageVirtualizer.getVirtualItems().map((virtualRow) => {
                    const row = imageRows[virtualRow.index] || [];
                    return (
                      <div
                        key={`img-row-${virtualRow.index}`}
                        data-index={virtualRow.index}
                        ref={imageVirtualizer.measureElement}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-1"
                      >
                        {row.map((asset) => (
                          <a
                            key={`${asset.fileName}-${asset.name}-${asset.page}`}
                            href={asset.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded border border-border overflow-hidden bg-background"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={asset.url} alt={asset.name} className="w-full h-40 object-contain bg-muted" loading="lazy" />
                            <p className="text-[11px] p-2 truncate">{asset.fileName} · p{asset.page} · {asset.name}</p>
                          </a>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function PageClient() {
  const endpoint = process.env.NEXT_PUBLIC_CHAT_WS_URL || "ws://127.0.0.1:8000/ws/chat";

  return (
    <ChatSessionProvider endpoint={endpoint}>
      <ChatPdfScreen />
    </ChatSessionProvider>
  );
}
