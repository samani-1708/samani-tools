import { PageLayout } from "../common/layouts";

export default function PDFLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageLayout>
      {children}
    </PageLayout>
  );
}
