import type { Metadata } from "next";
import { createMetadata } from "@/app/common/seo";

export const metadata: Metadata = createMetadata({
  title: "Crop PDF",
  description:
    "Crop PDF pages online by selecting a crop box for each page directly in your browser.",
  path: "/pdf/crop-pdf",
  keywords: ["crop pdf", "pdf cropper", "trim pdf", "cut pdf pages", "pdf editor"],
});

export default function CropPdfLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="w-full flex flex-col overflow-hidden"
      style={{ height: "calc(100vh - 64px)" }}
    >
      {children}
    </div>
  );
}
