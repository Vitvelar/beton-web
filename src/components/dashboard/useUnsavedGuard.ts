"use client";

import { useCallback, useEffect } from "react";

// Varnar áður en óvistaðar breytingar tapast (DESIGN.md §7): vafrinn spyr við endurhleðslu og
// lokun flipa (beforeunload); innri tenglar spyrja í onClick — beint með `confirmLeave` eða
// með <GuardedLink>, sem les sömu skráningu og því má nota hann í server-síðum.

let activeMessage: string | null = null;

/** Texti viðvörunar ef óvistaðar breytingar eru á síðunni núna, annars null. */
export function pendingLeaveMessage(): string | null {
  return activeMessage;
}

export function useUnsavedGuard(dirty: boolean, message: string) {
  useEffect(() => {
    if (!dirty) return;
    activeMessage = message;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Eldri vafrar sýna þennan streng; nýir sýna sinn eigin texta.
      event.returnValue = message;
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      if (activeMessage === message) activeMessage = null;
    };
  }, [dirty, message]);

  /** onClick á <Link>: hættir við leiðsögnina nema notandinn staðfesti. */
  return useCallback(
    (event: React.MouseEvent) => {
      if (dirty && !window.confirm(message)) event.preventDefault();
    },
    [dirty, message]
  );
}
