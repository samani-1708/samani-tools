"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useDiffStore } from "../store";
import type { DiffLine, EnrichedChange } from "../types";
import { MergeGutter } from "./merge-gutter";

function enrichedToLines(changes: EnrichedChange[]): DiffLine[] {
  const lines: DiffLine[] = [];

  for (const change of changes) {
    const content = change.value.replace(/\n$/, "");
    const subLines = content.split("\n");
    let oldLine = change.oldLineStart ?? 0;
    let newLine = change.newLineStart ?? 0;

    for (const sub of subLines) {
      if (change.type === "added") {
        lines.push({
          type: "added",
          content: sub,
          newLineNum: newLine++,
          changeId: change.id,
        });
      } else if (change.type === "removed") {
        lines.push({
          type: "removed",
          content: sub,
          oldLineNum: oldLine++,
          changeId: change.id,
        });
      } else {
        lines.push({
          type: "unchanged",
          content: sub,
          oldLineNum: oldLine++,
          newLineNum: newLine++,
          changeId: change.id,
        });
      }
    }
  }

  return lines;
}

export function UnifiedView() {
  const { diffResult, acceptedIds, rejectedIds } = useDiffStore();

  const lines = useMemo(
    () => (diffResult ? enrichedToLines(diffResult) : []),
    [diffResult]
  );

  const shownMergeIds = new Set<string>();

  return (
    <div className="font-mono text-sm leading-6 overflow-auto flex-1">
      <table className="w-full border-collapse">
        <tbody>
          {lines.map((line, i) => {
            const isChanged = line.type !== "unchanged";
            const showMerge =
              isChanged && !shownMergeIds.has(line.changeId);
            if (showMerge) shownMergeIds.add(line.changeId);

            const isAccepted = acceptedIds.has(line.changeId);
            const isRejected = rejectedIds.has(line.changeId);

            return (
              <tr
                key={i}
                className={cn(
                  "border-b border-border/40",
                  isAccepted && "opacity-60",
                  isRejected && "line-through opacity-40"
                )}
              >
                <td className="w-[1%] whitespace-nowrap px-2 text-right text-xs text-muted-foreground select-none border-r border-border bg-muted/30">
                  {line.oldLineNum ?? ""}
                </td>
                <td className="w-[1%] whitespace-nowrap px-2 text-right text-xs text-muted-foreground select-none border-r border-border bg-muted/30">
                  {line.newLineNum ?? ""}
                </td>
                <td className="w-[1%] whitespace-nowrap px-1 text-center select-none border-r border-border">
                  {line.type === "added" ? (
                    <span className="text-green-600 font-bold">+</span>
                  ) : line.type === "removed" ? (
                    <span className="text-red-600 font-bold">-</span>
                  ) : (
                    <span className="text-muted-foreground">&nbsp;</span>
                  )}
                </td>
                {/* Merge gutter */}
                <td className="w-[1%] whitespace-nowrap px-0.5 border-r border-border bg-muted/20">
                  {showMerge && isChanged && (
                    <MergeGutter changeId={line.changeId} />
                  )}
                </td>
                <td
                  className={cn(
                    "px-3 whitespace-pre-wrap break-all",
                    line.type === "added"
                      ? "bg-green-50"
                      : line.type === "removed"
                        ? "bg-red-50"
                        : ""
                  )}
                >
                  {line.content}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
