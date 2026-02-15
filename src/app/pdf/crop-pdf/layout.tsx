import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crop PDF - Free Online PDF Cropper",
  description:
    "Crop PDF pages online for free. Draw a crop box to select the area you want to keep. Works on all devices.",
  keywords: [
    "crop pdf",
    "pdf cropper",
    "trim pdf",
    "cut pdf pages",
    "pdf editor",
  ],
};

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
