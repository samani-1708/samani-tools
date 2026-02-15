import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add Page Numbers to PDF - Free Online Tool",
  description: "Add page numbers to PDF online for free. Customize position, format, and starting number. Works on all devices.",
  keywords: ["add page numbers pdf", "pdf page numbers", "number pdf pages", "pdf pagination", "pdf editor"],
};

export default function PageNumbersLayout({
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
