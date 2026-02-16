import type { Metadata, Viewport } from "next";
import { createMetadata } from "@/app/common/seo";

export const metadata: Metadata = createMetadata({
  title: "Case Converter",
  description: "Convert text between camelCase, snake_case, kebab-case, Title Case, and more.",
  path: "/utils/case-converter",
  keywords: ["case converter", "camelcase", "snake case", "kebab case", "text transform"],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="w-full flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
      {children}
    </div>
  );
}
