"use client";

import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2 } from "lucide-react";
import { useDiffStore } from "../store";
import type { CustomRule } from "../types";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

function SettingsContent() {
  const {
    ignoreWhitespace,
    ignoreCase,
    ignoreQuotes,
    ignoreDashes,
    toggleIgnore,
    customRules,
    addCustomRule,
    removeCustomRule,
    transforms,
    setTransform,
  } = useDiffStore();

  const [newRuleType, setNewRuleType] = useState<CustomRule["type"]>("word");
  const [newRulePattern, setNewRulePattern] = useState("");

  const handleAddRule = () => {
    if (!newRulePattern.trim()) return;
    addCustomRule({
      id: `rule-${Date.now()}`,
      type: newRuleType,
      pattern: newRulePattern.trim(),
    });
    setNewRulePattern("");
  };

  return (
    <div className="space-y-6 p-4">
      {/* Ignore Options */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Ignore Options</h3>
        <div className="space-y-2.5">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={ignoreWhitespace}
              onCheckedChange={() => toggleIgnore("ignoreWhitespace")}
            />
            Ignore whitespace
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={ignoreCase}
              onCheckedChange={() => toggleIgnore("ignoreCase")}
            />
            Ignore case
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={ignoreQuotes}
              onCheckedChange={() => toggleIgnore("ignoreQuotes")}
            />
            {"Ignore quotation style (' \" `)"}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={ignoreDashes}
              onCheckedChange={() => toggleIgnore("ignoreDashes")}
            />
            {"Ignore dash style (- \u2013 \u2014)"}
          </label>
        </div>
      </div>

      {/* Custom Ignore Rules */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Custom Ignore Rules</h3>
        <div className="space-y-2">
          {customRules.map((rule) => (
            <div
              key={rule.id}
              className="flex items-center gap-2 text-xs bg-muted/50 rounded px-2 py-1.5"
            >
              <span className="font-medium text-muted-foreground w-12">
                {rule.type}
              </span>
              <code className="flex-1 truncate">{rule.pattern}</code>
              <button
                onClick={() => removeCustomRule(rule.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Select
            value={newRuleType}
            onValueChange={(v) => setNewRuleType(v as CustomRule["type"])}
          >
            <SelectTrigger className="w-[90px] h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="word">Word</SelectItem>
              <SelectItem value="line">Line</SelectItem>
              <SelectItem value="regex">Regex</SelectItem>
            </SelectContent>
          </Select>
          <input
            type="text"
            value={newRulePattern}
            onChange={(e) => setNewRulePattern(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddRule()}
            placeholder="Pattern..."
            className="flex-1 h-7 rounded border border-input bg-transparent px-2 text-xs"
          />
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={handleAddRule}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Text Transforms */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Text Transforms</h3>
        <p className="text-xs text-muted-foreground mb-2">
          Applied before diffing
        </p>
        <div className="space-y-2.5">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={transforms.sortLines}
              onCheckedChange={(v) => setTransform("sortLines", !!v)}
            />
            Sort lines alphabetically
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={transforms.trimWhitespace}
              onCheckedChange={(v) => setTransform("trimWhitespace", !!v)}
            />
            Trim trailing whitespace
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={transforms.toLowerCase}
              onCheckedChange={(v) => setTransform("toLowerCase", !!v)}
            />
            Convert to lowercase
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={transforms.toUpperCase}
              onCheckedChange={(v) => setTransform("toUpperCase", !!v)}
            />
            Convert to uppercase
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={transforms.normalizeLineBreaks}
              onCheckedChange={(v) => setTransform("normalizeLineBreaks", !!v)}
            />
            {"Normalize line breaks (CRLF \u2192 LF)"}
          </label>
        </div>
      </div>
    </div>
  );
}

export function SettingsPanel() {
  const { settingsOpen, setSettingsOpen } = useDiffStore();
  const isMobile = useIsMobile();

  // Mobile: bottom sheet
  if (isMobile) {
    return (
      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent side="bottom" className="h-[70vh]">
          <SheetHeader>
            <SheetTitle>Settings</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-full">
            <SettingsContent />
          </ScrollArea>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: inline sidebar
  if (!settingsOpen) return null;

  return (
    <div className="w-[320px] border-l border-border h-full overflow-auto shrink-0">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="font-semibold text-sm">Settings</h2>
      </div>
      <ScrollArea className="h-full">
        <SettingsContent />
      </ScrollArea>
    </div>
  );
}
