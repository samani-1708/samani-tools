import type { Metadata, Viewport } from "next";
import { createMetadata } from "@/app/common/seo";

export const metadata: Metadata = createMetadata({
  title: "Edit Image",
  description:
    "Use a full online image editor with crop, resize, filters, annotations, and watermark controls.",
  path: "/image/edit-image",
  keywords: [
    "edit image online",
    "photo editor",
    "online image editor",
    "image filters",
    "annotate image",
  ],
});

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
