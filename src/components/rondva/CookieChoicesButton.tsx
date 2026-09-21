"use client";

import { openConsentDialog } from "@/lib/rondva-consent";

export function CookieChoicesButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={openConsentDialog}
      className={
        className ??
        "inline-flex items-center rounded-full border border-line-strong px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-ink"
      }
    >
      Change cookie choices
    </button>
  );
}
