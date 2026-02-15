import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Unlock PDF - Free Online PDF Password Remover",
  description: "Remove password protection from PDF online for free. Unlock password-protected PDFs instantly. Works on all devices.",
  keywords: ["unlock pdf", "remove pdf password", "decrypt pdf", "pdf password remover", "unprotect pdf"],
};

export default function UnlockPdfLayout({
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
