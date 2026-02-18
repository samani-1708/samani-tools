import type { Metadata, Viewport } from "next";
import { createMetadata } from "@/app/common/seo";
import { ToolContainer } from "@/app/common/tool-container";

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
  return <ToolContainer>{children}</ToolContainer>;
}
