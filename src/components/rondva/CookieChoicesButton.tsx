"use client";

import { openConsentDialog } from "@/lib/rondva-consent";
import { rvBtn } from "@/components/rondva/ui";

// Same condition as ConsentBanner: without tracker IDs no optional cookie is ever set, so there is
// no choice to change and the button would do nothing.
const HAS_TRACKERS =
  !!process.env.NEXT_PUBLIC_RONDVA_GA_ID || !!process.env.NEXT_PUBLIC_RONDVA_META_PIXEL_ID;

export function CookieChoicesButton({ className }: { className?: string }) {
  if (!HAS_TRACKERS) return null;
  return (
    <button type="button" onClick={openConsentDialog} className={className ?? rvBtn("secondary")}>
      Change cookie choices
    </button>
  );
}
