import type { Metadata, Viewport } from "next";
import { createMetadata } from "@/app/common/seo";

export const metadata: Metadata = createMetadata({
  title: "QR Code Generator",
  description:
    "Generate QR codes with a rich preset library, circular and instagram profile styles, UPI payment QR, center logos, and multiple export formats.",
  path: "/utils/qr-code",
  keywords: [
    "qr code generator",
    "styled qr code",
    "qr code presets",
    "qr code with logo",
    "circular qr code",
    "upi qr code",
    "instagram profile qr code",
    "instagram qr",
    "rounded qr code",
    "qr code online",
  ],
});

export const viewport: Viewport = {
  width: 'device-width', initialScale: 1, maximumScale: 1, userScalable: false,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="w-full flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>{children}</div>;
}
