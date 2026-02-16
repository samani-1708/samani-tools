import type { Metadata, Viewport } from "next";
import { createMetadata } from "@/app/common/seo";

export const metadata: Metadata = createMetadata({
  title: "Diff Checker",
  description: "Compare two texts side-by-side with line, word, or character-level diffing.",
  path: "/utils/diff-checker",
  keywords: ["diff checker", "text compare", "text diff", "compare files", "side by side diff"],
});

export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, maximumScale: 1, userScalable: false,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="w-full flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>{children}</div>;
}
