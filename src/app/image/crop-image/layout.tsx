import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Crop Image - Free Online Crop Tool | SamAni",
  description: "Crop images precisely with drag and zoom controls in your browser.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className="w-full flex flex-col overflow-hidden" style={{ height: "calc(100vh - 64px)" }}>{children}</div>;
}
