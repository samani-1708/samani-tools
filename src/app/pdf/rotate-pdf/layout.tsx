import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rotate PDF - Free Online PDF Rotator",
  description: "Rotate PDF pages online for free. Rotate pages left or right by 90, 180, or 270 degrees. Works on all devices.",
  keywords: ["rotate pdf", "pdf rotator", "turn pdf pages", "flip pdf", "pdf editor"],
};

export default function RotatePdfLayout({
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
