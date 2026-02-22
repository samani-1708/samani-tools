import { SiteHeader } from "./site-header/site-header";
import { SiteFooter } from "./site-footer/site-footer";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
