import type { EnrichedChange } from "../types";

export function buildMergedText(
  changes: EnrichedChange[],
  acceptedIds: Set<string>,
  rejectedIds: Set<string>
): string {
  const parts: string[] = [];

  for (const change of changes) {
    if (change.type === "unchanged") {
      parts.push(change.value);
    } else if (change.type === "added") {
      if (acceptedIds.has(change.id)) {
        // Accept addition: include it
        parts.push(change.value);
      }
      // If rejected or not decided, omit the addition
    } else if (change.type === "removed") {
      if (rejectedIds.has(change.id)) {
        // Reject removal = keep original text
        // (rejecting a removal means we DON'T want to remove it)
        // Actually: reject = discard this change = keep the removed text
        // accept = apply this change = remove the text
      } else if (!acceptedIds.has(change.id)) {
        // Not decided: keep original
        parts.push(change.value);
      }
      // If accepted, the removal is applied (text is removed)
    }
  }

  return parts.join("");
}

export function downloadMergedText(text: string, filename = "merged.txt") {
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
