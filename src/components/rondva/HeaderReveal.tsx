"use client";

import { useEffect, useRef, useState } from "react";

// Forsíðan opnar á kynningarmyndinni á fullum skjá: hausinn er falinn efst og rennur
// inn um leið og skrunað er (eða þegar lyklaborðsnotandi færir fókus í hann).
// Án JavaScript sést hausinn alltaf (sjá <noscript> og .rv-header-reveal í rondva.css).
const SHOW_AFTER = 24; // px

export function HeaderReveal({ children }: { children: React.ReactNode }) {
  const [shown, setShown] = useState(false);
  const focused = useRef(false);

  useEffect(() => {
    const onScroll = () => setShown(focused.current || window.scrollY > SHOW_AFTER);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <noscript>
        <style>{`.rv-header-reveal{transform:none!important;opacity:1!important;pointer-events:auto!important}`}</style>
      </noscript>
      <div
        className="rv-header-reveal"
        data-shown={shown ? "true" : "false"}
        onFocus={() => {
          focused.current = true;
          setShown(true);
        }}
        onBlur={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
          focused.current = false;
          setShown(window.scrollY > SHOW_AFTER);
        }}
      >
        {children}
      </div>
    </>
  );
}
