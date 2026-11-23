"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CONSENT_OPEN_EVENT,
  openConsentBanner,
  readConsent,
  writeConsent,
  type ConsentChoice,
} from "@/lib/beton-consent";
import { btn } from "@/lib/ui";

// Vafrakökuborði beton.is — stuttur, neðst á skjá, ekki modal. Birtist aðeins
// þeim sem hafa ekki valið (sjá src/lib/beton-consent.ts) og aftur ef hann er
// opnaður úr fætinum. Samþykkja/Hafna vista valið og uppfæra GTM strax.
//
// Fókus færist á borðann þegar hann opnast svo lyklaborðs- og skjálesara-
// notandi nái honum; Escape lokar án þess að veita samþykki (= óbreytt
// „denied“ þar til valið er, borðinn kemur þá aftur næst).

export function CookieBanner() {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Lestur localStorage er aðeins mögulegur í vafranum → eftir fyrstu teikningu.
    const first = readConsent() ? undefined : window.setTimeout(() => setOpen(true), 0);
    const onOpen = () => {
      openerRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setOpen(true);
    };
    window.addEventListener(CONSENT_OPEN_EVENT, onOpen);
    return () => {
      window.clearTimeout(first);
      window.removeEventListener(CONSENT_OPEN_EVENT, onOpen);
    };
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setShown(false);
    const opener = openerRef.current;
    openerRef.current = null;
    if (opener && opener.isConnected) opener.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!open) return;
    boxRef.current?.focus({ preventScroll: true });
    const raf = requestAnimationFrame(() => setShown(true));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  function decide(choice: ConsentChoice) {
    writeConsent(choice);
    close();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-6"
    >
      <div
        ref={boxRef}
        role="region"
        aria-label="Vafrakökur"
        tabIndex={-1}
        className={`mx-auto flex max-w-[720px] flex-col gap-4 rounded-sharp border border-line-strong bg-surface p-4 transition duration-200 ease-out focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none sm:flex-row sm:items-center sm:justify-between sm:p-5 ${
          shown ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}
      >
        <p className="m-0 text-sm leading-relaxed text-ink">
          Við notum vafrakökur til að bæta síðuna og mæla árangur auglýsinga.{" "}
          <Link href="/personuvernd" className="whitespace-nowrap text-navy underline underline-offset-4">
            Persónuvernd
          </Link>
        </p>
        <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex">
          <button
            type="button"
            onClick={() => decide("granted")}
            aria-label="Samþykkja vafrakökur"
            className={btn("primary", "md", "w-full sm:w-auto")}
          >
            Samþykkja
          </button>
          <button
            type="button"
            onClick={() => decide("denied")}
            aria-label="Hafna vafrakökum"
            className={btn("secondary", "md", "w-full sm:w-auto")}
          >
            Hafna
          </button>
        </div>
      </div>
    </div>
  );
}

/** Tengill í fæti sem opnar borðann aftur svo hægt sé að breyta vali. */
export function CookieChoicesLink({ className }: { className?: string }) {
  return (
    <button type="button" onClick={openConsentBanner} className={className}>
      Vafrakökur
    </button>
  );
}
