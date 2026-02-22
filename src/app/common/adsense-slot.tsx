"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

type AdsenseSlotProps = {
  className?: string;
  slotId?: string;
};

export function AdsenseSlot({ className, slotId }: AdsenseSlotProps) {
  const isProduction = process.env.NODE_ENV === "production";
  const enabled = process.env.NEXT_PUBLIC_ENABLE_ADSENSE === "true";
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID?.trim();
  const resolvedSlotId =
    slotId?.trim() || process.env.NEXT_PUBLIC_ADSENSE_SLOT_PAGE_COPY_TOP?.trim();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!isProduction || !enabled || !clientId || !resolvedSlotId || initializedRef.current) return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      initializedRef.current = true;
    } catch {
      // Ignore ad-block/runtime errors to avoid breaking page rendering.
    }
  }, [isProduction, enabled, clientId, resolvedSlotId]);

  if (!isProduction || !enabled || !clientId || !resolvedSlotId) {
    return null;
  }

  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={clientId}
        data-ad-slot={resolvedSlotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
