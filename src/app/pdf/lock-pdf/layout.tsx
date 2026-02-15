import type { Metadata } from "next";
import { createMetadata } from "@/app/common/seo";

export const metadata: Metadata = createMetadata({
  title: "Lock PDF",
  description:
    "Protect PDF files with password encryption directly in your browser.",
  path: "/pdf/lock-pdf",
  keywords: ["lock pdf", "password protect pdf", "encrypt pdf", "secure pdf", "pdf security"],
});

export default function LockPdfLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
      {children}
    </div>
  );
}
