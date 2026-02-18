import type { Metadata, Viewport } from "next";
import { createMetadata } from "@/app/common/seo";
import { ToolContainer } from "@/app/common/tool-container";

export const metadata: Metadata = createMetadata({
  title: "Hash Generator",
  description:
    "Generate hashes for text or files using MD5, SHA-1, SHA-2, SHA-3, and RIPEMD-160 algorithms.",
  path: "/utils/hash-generator",
  keywords: [
    "hash generator",
    "md5 generator",
    "sha1",
    "sha256",
    "sha512",
    "sha3",
    "ripemd160",
    "file hash",
    "checksum",
  ],
});

export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, maximumScale: 1, userScalable: false,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <ToolContainer>{children}</ToolContainer>;
}
