"use client";

import { useSearchParams } from "next/navigation";

export function useSectionVisibility() {
  const searchParams = useSearchParams();
  const sections = searchParams.getAll("section");

  // No param = show everything (landing pages, home, backwards compatible)
  if (sections.length === 0) return { header: true, footer: true };

  return {
    header: sections.includes("header"),
    footer: sections.includes("footer"),
  };
}
