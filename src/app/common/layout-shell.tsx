"use client";

import { Suspense } from "react";
import { useSectionVisibility } from "./section-visibility";
import { SiteHeader } from "./site-header/site-header";
import { SiteFooter } from "./site-footer/site-footer";

function LayoutShellInner({ children }: { children: React.ReactNode }) {
  const { header, footer } = useSectionVisibility();

  return (
    <>
      {header && <SiteHeader />}
      <main className="flex-1">{children}</main>
      {footer && <SiteFooter />}
    </>
  );
}

export function LayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<main className="flex-1">{children}</main>}>
      <LayoutShellInner>{children}</LayoutShellInner>
    </Suspense>
  );
}
