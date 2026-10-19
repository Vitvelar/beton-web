"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CONSENT_OPEN_EVENT, readConsent, writeConsent, type ConsentState } from "@/lib/rondva-consent";
import { rvBtn } from "@/components/rondva/ui";

// Vafrakökuborði rondva.com. Sýnist aðeins þegar mælitæki eru stillt
// (NEXT_PUBLIC_RONDVA_GA_ID / NEXT_PUBLIC_RONDVA_META_PIXEL_ID) og ekkert
// val er vistað. Sjálfgefið er allt óvirkt þar til gesturinn velur.
//
// Fókus færist á fyrirsögn borðans þegar hann opnast (og aftur þegar hann er opnaður úr fætinum),
// svo lyklaborðs- og skjálesaranotandi nær honum strax. Escape veitir aldrei samþykki: í „Manage“
// fer hann aftur í fyrsta lagið (eða lokar borðanum án breytinga ef val var þegar vistað).

const HAS_TRACKERS = !!process.env.NEXT_PUBLIC_RONDVA_GA_ID || !!process.env.NEXT_PUBLIC_RONDVA_META_PIXEL_ID;

export function ConsentBanner() {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const [manage, setManage] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const hadConsentRef = useRef(false);

  useEffect(() => {
    if (!HAS_TRACKERS) return;
    const existing = readConsent();
    hadConsentRef.current = !!existing;
    // Opnað á eftir fyrstu teikningu (lestur localStorage er aðeins mögulegur í vafranum).
    const first = existing ? undefined : window.setTimeout(() => setOpen(true), 0);
    const onOpen = () => {
      const current: ConsentState | null = readConsent();
      hadConsentRef.current = !!current;
      openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setAnalytics(!!current?.analytics);
      setMarketing(!!current?.marketing);
      setManage(true);
      setOpen(true);
    };
    window.addEventListener(CONSENT_OPEN_EVENT, onOpen);
    return () => {
      window.clearTimeout(first);
      window.removeEventListener(CONSENT_OPEN_EVENT, onOpen);
    };
  }, []);

  // Opnun: fókus á fyrirsögn strax, tilfærsla/dofnun á næsta ramma.
  useEffect(() => {
    if (!open) return;
    headingRef.current?.focus({ preventScroll: true });
    const raf = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(raf);
  }, [open]);

  function close() {
    setOpen(false);
    setShown(false);
    setManage(false);
    const opener = openerRef.current;
    openerRef.current = null;
    if (opener && opener.isConnected) opener.focus({ preventScroll: true });
  }

  // Escape: aldrei samþykki. Í „Manage“ → aftur í fyrsta lag (eða loka ef val var þegar til).
  useEffect(() => {
    if (!open || !manage) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      if (hadConsentRef.current) {
        close();
      } else {
        setManage(false);
        headingRef.current?.focus({ preventScroll: true });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, manage]);

  if (!open) return null;

  function decide(choice: { analytics: boolean; marketing: boolean }) {
    writeConsent(choice);
    close();
  }

  const checkRow = "flex items-start gap-3 rounded-lg border border-line bg-surface p-3 text-sm";

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="rv-consent-title"
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-6"
    >
      <div
        className={`mx-auto max-h-[calc(100dvh-2rem)] max-w-3xl overflow-y-auto overscroll-contain rounded-card border border-line bg-surface p-4 shadow-overlay transition duration-200 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none sm:p-6 ${
          shown ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="rv-consent-title" ref={headingRef} tabIndex={-1} className="text-sm font-semibold text-ink focus:outline-none">
            Cookies on rondva.com
          </h2>
          {!manage && (
            <button
              type="button"
              onClick={() => setManage(true)}
              className="-my-3 inline-flex min-h-11 shrink-0 items-center px-2 text-sm font-medium text-muted underline-offset-4 hover:text-ink hover:underline"
            >
              Manage
            </button>
          )}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted sm:hidden">
          One essential cookie remembers this choice. Analytics and marketing cookies stay off until you choose.{" "}
          <Link href="/cookies" className="underline underline-offset-4">
            Cookie policy
          </Link>
        </p>
        <p className="mt-2 hidden text-sm leading-relaxed text-muted sm:block">
          We use one essential cookie to remember this choice. With your permission we also use analytics cookies to see how the
          site is used, and marketing cookies to measure our ads. Nothing optional is set until you decide.{" "}
          <Link href="/cookies" className="underline underline-offset-4">
            Cookie policy
          </Link>
          .
        </p>

        {manage && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className={checkRow}>
              <input type="checkbox" checked disabled className="mt-0.5 size-5 shrink-0 accent-blue" />
              <span>
                <span className="font-medium text-ink">Essential</span>
                <span className="block text-muted">Remembers your cookie choice. Always on.</span>
              </span>
            </label>
            <label className={checkRow}>
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                className="mt-0.5 size-5 shrink-0 accent-blue"
              />
              <span>
                <span className="font-medium text-ink">Analytics</span>
                <span className="block text-muted">Google Analytics — which pages are read, where visitors come from.</span>
              </span>
            </label>
            <label className={`${checkRow} sm:col-span-2`}>
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
                className="mt-0.5 size-5 shrink-0 accent-blue"
              />
              <span>
                <span className="font-medium text-ink">Marketing</span>
                <span className="block text-muted">Meta and Google ad measurement — tells us which ads led to a sign-up.</span>
              </span>
            </label>
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:flex sm:flex-wrap">
          <button
            type="button"
            onClick={() => decide({ analytics: true, marketing: true })}
            className={rvBtn("primary", "md", "w-full sm:w-auto")}
          >
            Accept all
          </button>
          <button
            type="button"
            onClick={() => decide({ analytics: false, marketing: false })}
            className={rvBtn("secondary", "md", "w-full sm:w-auto")}
          >
            Essential only
          </button>
          {manage && (
            <button
              type="button"
              onClick={() => decide({ analytics, marketing })}
              className={rvBtn("secondary", "md", "col-span-2 w-full sm:col-span-1 sm:w-auto")}
            >
              Save choices
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
