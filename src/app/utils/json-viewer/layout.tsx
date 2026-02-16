import type { Metadata, Viewport } from "next";
import { createMetadata } from "@/app/common/seo";

export const metadata: Metadata = createMetadata({
  title: "JSON Viewer",
  description: "Format, minify, and explore JSON with a collapsible tree view and search.",
  path: "/utils/json-viewer",
  keywords: ["json viewer", "json formatter", "json tree", "json beautifier", "json minify"],
});

export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, maximumScale: 1, userScalable: false,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="w-full flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>{children}</div>;
}
