import { FileWithPages, PageFromPDFFile } from "@/app/common/hooks";
import { FileUploaded } from "@/app/common/types";
import { useEffect, useState } from "react";

function splitPagesIntoEqualGroups(
  totalPages: number,
  groupCountInput: string | number,
): number[][] {
  const groupCount = parseInt(
    typeof groupCountInput === "string"
      ? groupCountInput.trim()
      : String(groupCountInput),
  );

  if (isNaN(groupCount) || groupCount <= 0) {
    throw new Error("Please enter a valid number of PDFs");
  }

  if (groupCount > totalPages) {
    throw new Error(`Cannot split ${totalPages} pages into ${groupCount} PDFs`);
  }

  const groups: number[][] = [];
  const pagesPerGroup = Math.ceil(totalPages / groupCount);

  for (let i = 0; i < groupCount; i++) {
    const start = i * pagesPerGroup;
    const end = Math.min(start + pagesPerGroup, totalPages);

    if (start < totalPages) {
      const ranges = [];

      for (let i = start - 1; i < end - 1; i++) {
        ranges.push(i);
      }

      groups.push(ranges);
    }
  }

  return groups;
}

function splitPagesByRange(
  pages: PageFromPDFFile[],
  rangeInput: string,
): PageFromPDFFile[][] {
  const ranges: PageFromPDFFile[][] = [];
  const totalPages = pages.length;

  if (!rangeInput.trim()) {
    throw new Error("Please enter a valid range");
  }

  // Split by comma to get individual ranges/pages
  const parts = rangeInput.split(",").map((part) => part.trim());

  for (const part of parts) {
    if (part.includes("-")) {
      // Handle range like "1-5"
      const [startStr, endStr] = part.split("-").map((s) => s.trim());
      const start = parseInt(startStr) - 1; // Convert to 0-based index
      const end = parseInt(endStr) - 1;

      if (isNaN(start) || isNaN(end)) {
        throw new Error(`Invalid range: ${part}`);
      }

      if (start < 0 || end >= totalPages || start > end) {
        throw new Error(`Range ${part} is out of bounds (1-${totalPages})`);
      }

      const rangePages: PageFromPDFFile[] = [];
      for (let i = start; i <= end; i++) {
        rangePages.push(pages[i]);
      }
      ranges.push(rangePages);
    } else {
      // Handle single page like "3"
      const pageNum = parseInt(part) - 1; // Convert to 0-based index

      if (isNaN(pageNum)) {
        throw new Error(`Invalid page number: ${part}`);
      }

      if (pageNum < 0 || pageNum >= totalPages) {
        throw new Error(
          `Page ${parseInt(part)} is out of bounds (1-${totalPages})`,
        );
      }

      ranges.push([pages[pageNum]]);
    }
  }

  return ranges;
}
// No-op functions for unimplemented modes
const noOpGetRange = () => [];

export const SPLIT_MODE = {
  RANGE: {
    category: "Range",
    message: "Split by page ranges with start and end page numbers",
    inputType: "text",
    placeholder: "Add ranges with start and end page numbers",
    getRange: splitPagesByRange,
  },
  N_PER_PAGE: {
    category: "N Files",
    message: "Split into N files with equal number of pages",
    inputType: "number",
    placeholder: "Pages per PDF",
    getRange: splitPagesIntoEqualGroups,
  },
  BY_PAGE: {
    category: "By Page",
    message: "Split into individual pages or specific pages",
    inputType: "text",
    placeholder: "Comma-separated page numbers or leave empty for all",
    getRange: splitPagesByRange,
  },
  BY_SIZE: {
    category: "By Size",
    message: "Split by file size breakpoints",
    inputType: "number",
    placeholder: "Size per PDF in MB",
    getRange: noOpGetRange,
  },
} as const;

export type SplitModes = keyof typeof SPLIT_MODE;

export function usePageRanges(
  file: FileUploaded,
  firstPage: number,
  lastPage: number,
) {
  const [ranges, setRanges] = useState<number[][]>([]);
  const [mode, setMode] = useState<SplitModes>("RANGE");

  const resetPageRanges = () => {
    setRanges([]);
    setMode("RANGE");
  };

  useEffect(() => {
    if (file?.file && typeof firstPage === "number" && typeof lastPage === "number") {
      setRanges([[firstPage, lastPage]]);
    }
  }, [file?.file, firstPage, lastPage]);

  return {
    ranges,
    setRanges,
    mode,
    setMode,
    resetPageRanges,
  };
}

export type UsePageRangesReturnType = ReturnType<typeof usePageRanges>;
