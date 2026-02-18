import type { Metadata, Viewport } from "next";
import { createMetadata } from "@/app/common/seo";
import { ToolContainer } from "@/app/common/tool-container";

export const metadata: Metadata = createMetadata({
  title: "jwt-decode-encode",
  description:
    "Decode, verify, and encode JWT tokens with header and payload inspection plus HMAC signature validation.",
  path: "/utils/jwt-encode-decode",
  keywords: [
    "jwt decode",
    "jwt verifier",
    "jwt encoder",
    "jwt signature verify",
    "json web token tool",
  ],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ToolContainer>{children}</ToolContainer>
  );
}
