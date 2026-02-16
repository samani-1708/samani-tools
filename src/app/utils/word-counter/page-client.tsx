"use client";

import { useState, useMemo } from "react";
import { UtilityToolLayout } from "@/app/utils/common/utility-tool-layout";
import { Textarea } from "@/components/ui/textarea";
import { TypeIcon } from "lucide-react";

function countWords(text: string): number {
  if (!text.trim()) return 0;
  try {
    const segmenter = new Intl.Segmenter(undefined, { granularity: "word" });
    let count = 0;
    for (const segment of segmenter.segment(text)) {
      if (segment.isWordLike) count++;
    }
    return count;
  } catch {
    return text.trim().split(/\s+/).filter(Boolean).length;
  }
}

interface PlatformLimit {
  name: string;
  limit: number;
}

const PLATFORM_LIMITS: PlatformLimit[] = [
  { name: "Twitter / X", limit: 280 },
  { name: "Facebook", limit: 63206 },
  { name: "Instagram", limit: 2200 },
  { name: "LinkedIn", limit: 3000 },
  { name: "YouTube Title", limit: 100 },
  { name: "YouTube Desc", limit: 5000 },
];

export function PageClient() {
  const [text, setText] = useState("");

  const stats = useMemo(() => {
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, "").length;
    const words = countWords(text);
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim()).length;
    const paragraphs = text.split(/\n\n+/).filter((s) => s.trim()).length;
    const lines = text.split(/\n/).length;

    return { characters, charactersNoSpaces, words, sentences, paragraphs, lines };
  }, [text]);

  const content = (
    <div className="h-full flex flex-col gap-1.5">
      <Textarea
        placeholder="Paste or type your text here..."
        className="flex-1 resize-none text-sm min-h-[300px]"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
    </div>
  );

  const statRows: { label: string; value: number }[] = [
    { label: "Characters", value: stats.characters },
    { label: "Characters (no spaces)", value: stats.charactersNoSpaces },
    { label: "Words", value: stats.words },
    { label: "Sentences", value: stats.sentences },
    { label: "Paragraphs", value: stats.paragraphs },
    { label: "Lines", value: stats.lines },
  ];

  const controls = (
    <div className="space-y-6">
      {/* Stats panel */}
      <div>
        <h3 className="text-sm font-medium mb-3">Text Statistics</h3>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {statRows.map((row, i) => (
            <div
              key={row.label}
              className={`flex items-center justify-between px-3 py-2 text-sm ${
                i !== statRows.length - 1
                  ? "border-b border-gray-200 dark:border-gray-700"
                  : ""
              }`}
            >
              <span className="text-muted-foreground">{row.label}</span>
              <span className="font-medium tabular-nums">{row.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Platform limits */}
      <div>
        <h3 className="text-sm font-medium mb-3">Platform Limits</h3>
        <div className="space-y-3">
          {PLATFORM_LIMITS.map((platform) => {
            const charCount = stats.characters;
            const percentage = Math.min((charCount / platform.limit) * 100, 100);
            const isOver = charCount > platform.limit;

            return (
              <div key={platform.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{platform.name}</span>
                  <span
                    className={`tabular-nums font-medium ${
                      isOver ? "text-red-500" : ""
                    }`}
                  >
                    {charCount.toLocaleString()} / {platform.limit.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isOver ? "bg-red-500" : "bg-cyan-500"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const actions = <></>;

  return (
    <UtilityToolLayout
      sidebarTitle="Word Counter"
      sidebarIcon={<TypeIcon className="w-5 h-5" />}
      sidebarWidth="md"
      content={content}
      controls={controls}
      actions={actions}
    />
  );
}
