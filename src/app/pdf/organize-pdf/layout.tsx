import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Organize PDF - Free Online PDF Page Organizer",
  description: "Organize PDF pages online for free. Delete, rotate, reorder, and add pages. Drag and drop to rearrange. Works on all devices.",
  keywords: ["organize pdf", "rearrange pdf pages", "delete pdf pages", "reorder pdf", "pdf page manager"],
};

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
