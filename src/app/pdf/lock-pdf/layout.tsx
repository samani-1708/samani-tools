import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lock PDF - Free Online PDF Password Protection",
  description: "Protect your PDF with a password online for free. Add password protection to prevent unauthorized access. Works on all devices.",
  keywords: ["lock pdf", "password protect pdf", "encrypt pdf", "secure pdf", "pdf security"],
};

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
