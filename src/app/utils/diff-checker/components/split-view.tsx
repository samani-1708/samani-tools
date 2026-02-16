"use client";

import { useMemo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useDiffStore } from "../store";
import type { DiffLine, SplitRow, EnrichedChange } from "../types";
import { InlineHighlight } from "./inline-highlight";
import { MergeGutter } from "./merge-gutter";
import { highlightCode } from "../lib/syntax-highlight";

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

function buildSplitRows(lines: DiffLine[]): SplitRow[] {
  const rows: SplitRow[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.type === "unchanged") {
      rows.push({ left: line, right: line });
      i++;
    } else if (line.type === "removed") {
      const removed: DiffLine[] = [];
      while (i < lines.length && lines[i].type === "removed") {
        removed.push(lines[i]);
        i++;
      }
      const added: DiffLine[] = [];
      while (i < lines.length && lines[i].type === "added") {
        added.push(lines[i]);
        i++;
      }
      const max = Math.max(removed.length, added.length);
      for (let j = 0; j < max; j++) {
        rows.push({
          left: j < removed.length ? removed[j] : null,
          right: j < added.length ? added[j] : null,
          changeId: removed[0]?.changeId ?? added[0]?.changeId,
        });
      }
    } else if (line.type === "added") {
      rows.push({ left: null, right: line, changeId: line.changeId });
      i++;
    }
  }

  return rows;
}

function SyntaxLine({ content, lang }: { content: string; lang: string }) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    if (lang === "plaintext") return;
    let cancelled = false;
    highlightCode(content, lang).then((result) => {
      if (!cancelled) setHtml(result);
    });
    return () => {
      cancelled = true;
    };
  }, [content, lang]);

  if (html && lang !== "plaintext") {
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  }
  return <>{content}</>;
}

export function SplitView() {
  const { diffResult, precision, syntaxLang, acceptedIds, rejectedIds } =
    useDiffStore();

  const lines = useMemo(
    () => (diffResult ? enrichedToLines(diffResult) : []),
    [diffResult]
  );

  const rows = useMemo(() => buildSplitRows(lines), [lines]);

  const useSyntax = syntaxLang !== "plaintext" && lines.length <= 5000;

  // Track which change IDs we've already shown merge buttons for
  const shownMergeIds = new Set<string>();

  return (
    <div className="font-mono text-sm leading-6 overflow-auto flex-1">
      <table className="w-full border-collapse">
        <tbody>
          {rows.map((row, i) => {
            const isChanged =
              row.left?.type === "removed" || row.right?.type === "added";
            const changeId = row.changeId ?? row.left?.changeId ?? row.right?.changeId;
            const showMerge =
              isChanged && changeId && !shownMergeIds.has(changeId);
            if (showMerge && changeId) shownMergeIds.add(changeId);

            const isAccepted = changeId ? acceptedIds.has(changeId) : false;
            const isRejected = changeId ? rejectedIds.has(changeId) : false;

            return (
              <tr
                key={i}
                className={cn(
                  "border-b border-border/40",
                  isAccepted && "opacity-60",
                  isRejected && "line-through opacity-40"
                )}
              >
                {/* Left line number */}
                <td className="w-[1%] whitespace-nowrap px-2 text-right text-xs text-muted-foreground select-none border-r border-border bg-muted/30">
                  {row.left?.oldLineNum ?? ""}
                </td>
                {/* Left merge gutter */}
                {isChanged && (
                  <td className="w-[1%] whitespace-nowrap px-0.5 border-r border-border bg-muted/20">
                    {showMerge && changeId && (
                      <MergeGutter changeId={changeId} />
                    )}
                  </td>
                )}
                {!isChanged && (
                  <td className="w-[1%] whitespace-nowrap px-0.5 border-r border-border bg-muted/20" />
                )}
                {/* Left content */}
                <td
                  className={cn(
                    "px-3 whitespace-pre-wrap break-all border-r border-border",
                    row.left?.type === "removed"
                      ? "bg-red-50"
                      : row.left === null
                        ? "bg-muted/20 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(0,0,0,0.03)_5px,rgba(0,0,0,0.03)_10px)]"
                        : ""
                  )}
                >
                  {row.left ? (
                    row.left.type === "removed" &&
                    row.right?.type === "added" ? (
                      <InlineHighlight
                        oldText={row.left.content}
                        newText={row.right.content}
                        side="left"
                        precision={precision === "line" ? "word" : precision}
                      />
                    ) : useSyntax ? (
                      <SyntaxLine
                        content={row.left.content}
                        lang={syntaxLang}
                      />
                    ) : (
                      row.left.content
                    )
                  ) : (
                    ""
                  )}
                </td>
                {/* Right line number */}
                <td className="w-[1%] whitespace-nowrap px-2 text-right text-xs text-muted-foreground select-none border-r border-border bg-muted/30">
                  {row.right?.newLineNum ?? ""}
                </td>
                {/* Right content */}
                <td
                  className={cn(
                    "px-3 whitespace-pre-wrap break-all",
                    row.right?.type === "added"
                      ? "bg-green-50"
                      : row.right === null
                        ? "bg-muted/20 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(0,0,0,0.03)_5px,rgba(0,0,0,0.03)_10px)]"
                        : ""
                  )}
                >
                  {row.right ? (
                    row.right.type === "added" &&
                    row.left?.type === "removed" ? (
                      <InlineHighlight
                        oldText={row.left.content}
                        newText={row.right.content}
                        side="right"
                        precision={precision === "line" ? "word" : precision}
                      />
                    ) : useSyntax ? (
                      <SyntaxLine
                        content={row.right.content}
                        lang={syntaxLang}
                      />
                    ) : (
                      row.right.content
                    )
                  ) : (
                    ""
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
