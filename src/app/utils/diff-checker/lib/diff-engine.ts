import { diffLines, diffWords, diffChars } from "diff";
import type { EnrichedChange, Precision, CustomRule, Transforms } from "../types";
import { preprocessText } from "./text-preprocessor";

export interface DiffOptions {
  precision: Precision;
  ignoreWhitespace: boolean;
  ignoreCase: boolean;
  ignoreQuotes: boolean;
  ignoreDashes: boolean;
  customRules: CustomRule[];
  transforms: Transforms;
}

export function computeDiffResult(
  leftText: string,
  rightText: string,
  options: DiffOptions
): EnrichedChange[] {
  const preprocessOpts = {
    ignoreWhitespace: options.ignoreWhitespace,
    ignoreCase: options.ignoreCase,
    ignoreQuotes: options.ignoreQuotes,
    ignoreDashes: options.ignoreDashes,
    customRules: options.customRules,
    transforms: options.transforms,
  };

  const processedLeft = preprocessText(leftText, preprocessOpts);
  const processedRight = preprocessText(rightText, preprocessOpts);

  let changes;
  if (options.precision === "word") {
    changes = diffWords(processedLeft, processedRight);
  } else if (options.precision === "char") {
    changes = diffChars(processedLeft, processedRight);
  } else {
    changes = diffLines(processedLeft, processedRight);
  }

  const enriched: EnrichedChange[] = [];
  let oldLine = 1;
  let newLine = 1;
  let idCounter = 0;

  for (const change of changes) {
    const id = `change-${idCounter++}`;
    const value = change.value;
    const lineCount = value.split("\n").length - (value.endsWith("\n") ? 1 : 0);

    if (change.added) {
      enriched.push({
        id,
        type: "added",
        value,
        oldLineStart: null,
        newLineStart: newLine,
        lineCount,
      });
      newLine += lineCount;
    } else if (change.removed) {
      enriched.push({
        id,
        type: "removed",
        value,
        oldLineStart: oldLine,
        newLineStart: null,
        lineCount,
      });
      oldLine += lineCount;
    } else {
      enriched.push({
        id,
        type: "unchanged",
        value,
        oldLineStart: oldLine,
        newLineStart: newLine,
        lineCount,
      });
      oldLine += lineCount;
      newLine += lineCount;
    }
  }

  return enriched;
}
