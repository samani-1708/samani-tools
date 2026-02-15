import type { Metadata } from "next";
import { createMetadata } from "@/app/common/seo";

export const metadata: Metadata = createMetadata({
  title: "Unlock PDF",
  description:
    "Remove PDF password protection online for files you are authorized to open.",
  path: "/pdf/unlock-pdf",
  keywords: ["unlock pdf", "remove pdf password", "decrypt pdf", "pdf password remover", "unprotect pdf"],
});

export default function UnlockPdfLayout({
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
