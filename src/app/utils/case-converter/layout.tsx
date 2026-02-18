import type { Metadata, Viewport } from "next";
import { createMetadata } from "@/app/common/seo";
import { ToolContainer } from "@/app/common/tool-container";

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
    <ToolContainer>{children}</ToolContainer>
  );
}
