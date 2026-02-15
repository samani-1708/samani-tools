import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Edit Image - Full Image Editor Online | SamAni",
  description:
    "Edit images with crop, filters, resize, annotate, and watermark tools directly in your browser.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="w-full flex flex-col overflow-hidden"
      style={{ height: "calc(100vh - 64px)" }}
    >
      {children}
    </div>
  );
}
