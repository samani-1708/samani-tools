"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDiffStore } from "../store";

export function MergeGutter({ changeId }: { changeId: string }) {
  const { acceptChange, rejectChange, acceptedIds, rejectedIds } =
    useDiffStore();

  const isAccepted = acceptedIds.has(changeId);
  const isRejected = rejectedIds.has(changeId);

  return (
    <span className="inline-flex items-center gap-0.5 mr-1">
      <button
        onClick={() => acceptChange(changeId)}
        className={cn(
          "p-0.5 rounded hover:bg-green-100 transition-colors",
          isAccepted && "bg-green-200 text-green-700"
        )}
        title="Accept change"
      >
        <Check className="h-3 w-3" />
      </button>
      <button
        onClick={() => rejectChange(changeId)}
        className={cn(
          "p-0.5 rounded hover:bg-red-100 transition-colors",
          isRejected && "bg-red-200 text-red-700"
        )}
        title="Reject change"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
