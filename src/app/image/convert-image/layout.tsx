import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Convert Image - PNG JPG WEBP AVIF | SamAni",
  description:
    "Convert images between PNG, JPG, WEBP, and AVIF directly in your browser. HEIC output currently depends on browser support.",
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
