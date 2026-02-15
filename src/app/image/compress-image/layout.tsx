import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Compress Image - Reduce JPG PNG WEBP AVIF Size | SamAni",
  description:
    "Compress images in your browser with quality and size controls. Keep privacy while reducing file size.",
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
