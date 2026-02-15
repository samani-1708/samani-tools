import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Resize Image - Change Image Dimensions | SamAni",
  description:
    "Resize image width and height with aspect-ratio lock directly in your browser.",
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
