import type { Metadata, Viewport } from "next";
import { createMetadata } from "@/app/common/seo";
import { ToolContainer } from "@/app/common/tool-container";

export const metadata: Metadata = createMetadata({
  title: "Word Counter",
  description: "Count words, characters, sentences, and paragraphs with social media character limits.",
  path: "/utils/word-counter",
  keywords: ["word counter", "character count", "text statistics", "social media limits"],
});

export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, maximumScale: 1, userScalable: false,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <ToolContainer>{children}</ToolContainer>;
}
