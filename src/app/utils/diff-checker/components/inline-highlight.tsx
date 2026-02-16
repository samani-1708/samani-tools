"use client";

import { useMemo } from "react";
import { diffWords, diffChars, type Change } from "diff";
import type { Precision } from "../types";

export function InlineHighlight({
  oldText,
  newText,
  side,
  precision = "word",
}: {
  oldText: string;
  newText: string;
  side: "left" | "right";
  precision?: Precision;
}) {
  const changes = useMemo(() => {
    const fn = precision === "char" ? diffChars : diffWords;
    return fn(oldText, newText);
  }, [oldText, newText, precision]);

  return (
    <span>
      {changes.map((change: Change, i: number) => {
        if (side === "left") {
          if (change.added) return null;
          if (change.removed) {
            return (
              <span key={i} className="bg-red-300/60 rounded-sm px-[1px]">
                {change.value}
              </span>
            );
          }
          return <span key={i}>{change.value}</span>;
        } else {
          if (change.removed) return null;
          if (change.added) {
            return (
              <span key={i} className="bg-green-300/60 rounded-sm px-[1px]">
                {change.value}
              </span>
            );
          }
          return <span key={i}>{change.value}</span>;
        }
      })}
    </span>
  );
}
