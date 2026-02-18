"use client";

import { Suspense } from "react";
import { useSectionVisibility } from "./section-visibility";

function ToolContainerInner({ children }: { children: React.ReactNode }) {
  const { header } = useSectionVisibility();

  return (
    <div
      className="w-full flex flex-col overflow-hidden"
      style={{ height: header ? "calc(100vh - 64px)" : "100vh" }}
    >
      {children}
    </div>
  );
}

export function ToolContainer({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div
          className="w-full flex flex-col overflow-hidden"
          style={{ height: "calc(100vh - 64px)" }}
        >
          {children}
        </div>
      }
    >
      <ToolContainerInner>{children}</ToolContainerInner>
    </Suspense>
  );
}
