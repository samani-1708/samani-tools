import type { Metadata, Viewport } from "next";
import { createMetadata } from "@/app/common/seo";
import { ToolContainer } from "@/app/common/tool-container";

export const metadata: Metadata = createMetadata({
  title: "Convert Image",
  description:
    "Convert images between JPG, PNG, WEBP, AVIF, and TIFF formats in your browser with privacy-first processing.",
  path: "/image/convert-image",
  keywords: [
    "convert image",
    "jpg to png",
    "png to jpg",
    "webp converter",
    "avif converter",
    "tiff converter",
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
