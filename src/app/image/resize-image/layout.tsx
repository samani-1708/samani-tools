import type { Metadata, Viewport } from "next";
import { createMetadata } from "@/app/common/seo";

export const metadata: Metadata = createMetadata({
  title: "Resize Image",
  description:
    "Resize image dimensions by width, height, or percentage with aspect-ratio lock support.",
  path: "/image/resize-image",
  keywords: [
    "resize image",
    "change image dimensions",
    "photo resizer",
    "aspect ratio lock",
    "online image resize",
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
