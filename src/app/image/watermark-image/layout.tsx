import type { Metadata, Viewport } from "next";
import { createMetadata } from "@/app/common/seo";
import { ToolContainer } from "@/app/common/tool-container";

export const metadata: Metadata = createMetadata({
  title: "Watermark Image",
  description:
    "Add text watermark to images with controls for size, color, opacity, rotation, and position.",
  path: "/image/watermark-image",
  keywords: [
    "watermark image",
    "add watermark to photo",
    "text watermark",
    "copyright watermark",
    "watermark tool online",
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
