import type { CustomRule, Transforms } from "../types";

export interface PreprocessOptions {
  ignoreWhitespace: boolean;
  ignoreCase: boolean;
  ignoreQuotes: boolean;
  ignoreDashes: boolean;
  customRules: CustomRule[];
  transforms: Transforms;
}

export function preprocessText(text: string, opts: PreprocessOptions): string {
  let result = text;

  // Apply transforms first
  if (opts.transforms.normalizeLineBreaks) {
    result = result.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  }
  if (opts.transforms.trimWhitespace) {
    result = result
      .split("\n")
      .map((line) => line.trimEnd())
      .join("\n");
  }
  if (opts.transforms.sortLines) {
    const lines = result.split("\n");
    lines.sort((a, b) => a.localeCompare(b));
    result = lines.join("\n");
  }
  if (opts.transforms.toLowerCase) {
    result = result.toLowerCase();
  }
  if (opts.transforms.toUpperCase) {
    result = result.toUpperCase();
  }

  // Apply ignore options
  if (opts.ignoreWhitespace) {
    result = result
      .split("\n")
      .map((line) => line.replace(/\s+/g, " ").trim())
      .join("\n");
  }
  if (opts.ignoreCase) {
    result = result.toLowerCase();
  }
  if (opts.ignoreQuotes) {
    result = result.replace(/[`'"]/g, '"');
  }
  if (opts.ignoreDashes) {
    result = result.replace(/[\u2013\u2014]/g, "-");
  }

  // Apply custom rules
  for (const rule of opts.customRules) {
    switch (rule.type) {
      case "word":
        result = result.replace(
          new RegExp(`\\b${escapeRegex(rule.pattern)}\\b`, "g"),
          ""
        );
        break;
      case "line":
        result = result
          .split("\n")
          .filter((line) => !line.includes(rule.pattern))
          .join("\n");
        break;
      case "regex":
        try {
          result = result.replace(new RegExp(rule.pattern, "gm"), "");
        } catch {
          // Invalid regex, skip
        }
        break;
    }
  }

  return result;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
