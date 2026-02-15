import type { Metadata, Viewport } from "next";
import { createMetadata } from "@/app/common/seo";

export const metadata: Metadata = createMetadata({
  title: "Crop Image",
  description:
    "Crop images precisely with drag, zoom, rotate, and flip controls directly in your browser.",
  path: "/image/crop-image",
  keywords: [
    "crop image",
    "image cropper",
    "crop photo online",
    "rotate image",
    "flip image",
  ],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className="w-full flex flex-col overflow-hidden" style={{ height: "calc(100vh - 64px)" }}>{children}</div>;
}
