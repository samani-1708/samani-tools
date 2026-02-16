export type FileType = "text" | "image";
export type ViewMode = "split" | "unified";
export type Precision = "line" | "word" | "char";

export interface CustomRule {
  id: string;
  type: "word" | "line" | "regex";
  pattern: string;
}

export interface Transforms {
  sortLines: boolean;
  trimWhitespace: boolean;
  toLowerCase: boolean;
  toUpperCase: boolean;
  normalizeLineBreaks: boolean;
}

export interface EnrichedChange {
  id: string;
  type: "added" | "removed" | "unchanged";
  value: string;
  oldLineStart: number | null;
  newLineStart: number | null;
  lineCount: number;
}

export interface SplitRow {
  left: DiffLine | null;
  right: DiffLine | null;
  changeId?: string;
}

export interface DiffLine {
  type: "added" | "removed" | "unchanged";
  content: string;
  oldLineNum?: number;
  newLineNum?: number;
  changeId: string;
}

export const SUPPORTED_LANGUAGES = [
  { value: "plaintext", label: "Plain Text" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "json", label: "JSON" },
  { value: "markdown", label: "Markdown" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "sql", label: "SQL" },
  { value: "yaml", label: "YAML" },
  { value: "xml", label: "XML" },
  { value: "bash", label: "Bash" },
] as const;
