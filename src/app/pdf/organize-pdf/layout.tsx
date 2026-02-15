import type { Metadata } from "next";
import { createMetadata } from "@/app/common/seo";

export const metadata: Metadata = createMetadata({
  title: "Organize PDF",
  description:
    "Organize PDF pages online by reordering, rotating, deleting, or adding pages.",
  path: "/pdf/organize-pdf",
  keywords: ["organize pdf", "rearrange pdf pages", "delete pdf pages", "reorder pdf", "pdf page manager"],
});

export default function OrganizePdfLayout({
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
