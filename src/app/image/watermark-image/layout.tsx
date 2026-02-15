import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Watermark Image - Add Text Watermark Online | SamAni",
  description:
    "Add customizable text watermarks to images with position, color, and opacity controls.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className="w-full flex flex-col overflow-hidden" style={{ height: "calc(100vh - 64px)" }}>{children}</div>;
}
