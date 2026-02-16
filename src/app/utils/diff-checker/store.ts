import { create } from "zustand";
import type {
  FileType,
  ViewMode,
  Precision,
  CustomRule,
  Transforms,
  EnrichedChange,
} from "./types";
import { computeDiffResult } from "./lib/diff-engine";
import { buildMergedText } from "./lib/merge-utils";

interface DiffStore {
  // Inputs
  leftText: string;
  rightText: string;
  fileType: FileType;
  leftFile: File | null;
  rightFile: File | null;

  // View
  viewMode: ViewMode;
  precision: Precision;
  syntaxLang: string;

  // Ignore options
  ignoreWhitespace: boolean;
  ignoreCase: boolean;
  ignoreQuotes: boolean;
  ignoreDashes: boolean;

  // Custom ignore rules
  customRules: CustomRule[];

  // Transforms
  transforms: Transforms;

  // Diff result
  hasDiffed: boolean;
  computing: boolean;
  diffResult: EnrichedChange[] | null;

  // Merge state
  acceptedIds: Set<string>;
  rejectedIds: Set<string>;

  // Settings panel
  settingsOpen: boolean;

  // Actions
  setLeftText: (text: string) => void;
  setRightText: (text: string) => void;
  swapSides: () => void;
  reset: () => void;
  setViewMode: (mode: ViewMode) => void;
  setPrecision: (p: Precision) => void;
  setSyntaxLang: (lang: string) => void;
  setFileType: (ft: FileType) => void;
  setLeftFile: (f: File | null) => void;
  setRightFile: (f: File | null) => void;
  toggleIgnore: (key: "ignoreWhitespace" | "ignoreCase" | "ignoreQuotes" | "ignoreDashes") => void;
  addCustomRule: (rule: CustomRule) => void;
  removeCustomRule: (id: string) => void;
  setTransform: (key: keyof Transforms, value: boolean) => void;
  computeDiff: () => void;
  acceptChange: (id: string) => void;
  rejectChange: (id: string) => void;
  acceptAll: () => void;
  rejectAll: () => void;
  getMergedText: () => string;
  setSettingsOpen: (open: boolean) => void;
  editInputs: () => void;
}

export const useDiffStore = create<DiffStore>((set, get) => ({
  leftText: "",
  rightText: "",
  fileType: "text",
  leftFile: null,
  rightFile: null,

  viewMode: "split",
  precision: "line",
  syntaxLang: "plaintext",

  ignoreWhitespace: false,
  ignoreCase: false,
  ignoreQuotes: false,
  ignoreDashes: false,

  customRules: [],

  transforms: {
    sortLines: false,
    trimWhitespace: false,
    toLowerCase: false,
    toUpperCase: false,
    normalizeLineBreaks: false,
  },

  hasDiffed: false,
  computing: false,
  diffResult: null,

  acceptedIds: new Set(),
  rejectedIds: new Set(),

  settingsOpen: false,

  setLeftText: (text) => set({ leftText: text, hasDiffed: false, diffResult: null }),
  setRightText: (text) => set({ rightText: text, hasDiffed: false, diffResult: null }),

  swapSides: () => {
    const { leftText, rightText, leftFile, rightFile } = get();
    set({
      leftText: rightText,
      rightText: leftText,
      leftFile: rightFile,
      rightFile: leftFile,
      hasDiffed: false,
      diffResult: null,
    });
  },

  reset: () =>
    set({
      leftText: "",
      rightText: "",
      leftFile: null,
      rightFile: null,
      hasDiffed: false,
      computing: false,
      diffResult: null,
      acceptedIds: new Set(),
      rejectedIds: new Set(),
    }),

  setViewMode: (mode) => set({ viewMode: mode }),
  setPrecision: (p) => set({ precision: p }),
  setSyntaxLang: (lang) => set({ syntaxLang: lang }),
  setFileType: (ft) => set({ fileType: ft, hasDiffed: false, diffResult: null }),
  setLeftFile: (f) => set({ leftFile: f }),
  setRightFile: (f) => set({ rightFile: f }),

  toggleIgnore: (key) => set((s) => ({ [key]: !s[key] })),

  addCustomRule: (rule) => set((s) => ({ customRules: [...s.customRules, rule] })),
  removeCustomRule: (id) =>
    set((s) => ({ customRules: s.customRules.filter((r) => r.id !== id) })),

  setTransform: (key, value) =>
    set((s) => ({ transforms: { ...s.transforms, [key]: value } })),

  computeDiff: () => {
    const s = get();
    const result = computeDiffResult(s.leftText, s.rightText, {
      precision: s.precision,
      ignoreWhitespace: s.ignoreWhitespace,
      ignoreCase: s.ignoreCase,
      ignoreQuotes: s.ignoreQuotes,
      ignoreDashes: s.ignoreDashes,
      customRules: s.customRules,
      transforms: s.transforms,
    });
    set({
      hasDiffed: true,
      computing: false,
      diffResult: result,
      acceptedIds: new Set(),
      rejectedIds: new Set(),
    });
  },

  acceptChange: (id) =>
    set((s) => {
      const next = new Set(s.acceptedIds);
      next.add(id);
      const rej = new Set(s.rejectedIds);
      rej.delete(id);
      return { acceptedIds: next, rejectedIds: rej };
    }),

  rejectChange: (id) =>
    set((s) => {
      const next = new Set(s.rejectedIds);
      next.add(id);
      const acc = new Set(s.acceptedIds);
      acc.delete(id);
      return { rejectedIds: next, acceptedIds: acc };
    }),

  acceptAll: () => {
    const { diffResult } = get();
    if (!diffResult) return;
    const ids = new Set(diffResult.filter((c) => c.type !== "unchanged").map((c) => c.id));
    set({ acceptedIds: ids, rejectedIds: new Set() });
  },

  rejectAll: () => {
    const { diffResult } = get();
    if (!diffResult) return;
    const ids = new Set(diffResult.filter((c) => c.type !== "unchanged").map((c) => c.id));
    set({ rejectedIds: ids, acceptedIds: new Set() });
  },

  getMergedText: () => {
    const { diffResult, acceptedIds, rejectedIds, leftText } = get();
    if (!diffResult) return leftText;
    return buildMergedText(diffResult, acceptedIds, rejectedIds);
  },

  setSettingsOpen: (open) => set({ settingsOpen: open }),
  editInputs: () => set({ hasDiffed: false, diffResult: null }),
}));
