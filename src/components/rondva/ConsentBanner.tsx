"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CONSENT_OPEN_EVENT,
  readConsent,
  writeConsent,
  type ConsentState,
} from "@/lib/rondva-consent";

// Vafrakökuborði rondva.com. Sýnist aðeins þegar mælitæki eru stillt
// (NEXT_PUBLIC_RONDVA_GA_ID / NEXT_PUBLIC_RONDVA_META_PIXEL_ID) og ekkert
// val er vistað. Sjálfgefið er allt óvirkt þar til gesturinn velur.

const HAS_TRACKERS =
  !!process.env.NEXT_PUBLIC_RONDVA_GA_ID || !!process.env.NEXT_PUBLIC_RONDVA_META_PIXEL_ID;

export function ConsentBanner() {
  const [open, setOpen] = useState(false);
  const [manage, setManage] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (!HAS_TRACKERS) return;
    const existing = readConsent();
    if (!existing) setOpen(true);
    const onOpen = () => {
      const current: ConsentState | null = readConsent();
      setAnalytics(!!current?.analytics);
      setMarketing(!!current?.marketing);
      setManage(true);
      setOpen(true);
    };
    window.addEventListener(CONSENT_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, onOpen);
  }, []);

  if (!open) return null;

  function decide(choice: { analytics: boolean; marketing: boolean }) {
    writeConsent(choice);
    setOpen(false);
    setManage(false);
  }

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="rv-consent-title"
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:px-6 sm:pb-6"
    >
      <div className="mx-auto max-w-3xl rounded-card border border-line bg-paper p-5 shadow-[0_12px_40px_rgba(16,20,24,0.12)] sm:p-6">
        <p id="rv-consent-title" className="text-sm font-semibold text-ink">
          Cookies on rondva.com
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          We use one essential cookie to remember this choice. With your permission we also
          use analytics cookies to see how the site is used, and marketing cookies to measure
          our ads. Nothing optional is set until you decide.{" "}
          <Link href="/cookies" className="underline underline-offset-4">
            Cookie policy
          </Link>
          .
        </p>

        {manage && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="flex items-start gap-3 rounded-lg border border-line p-3 text-sm">
              <input type="checkbox" checked disabled className="mt-0.5" />
              <span>
                <span className="font-medium text-ink">Essential</span>
                <span className="block text-muted">Remembers your cookie choice. Always on.</span>
              </span>
            </label>
            <label className="flex items-start gap-3 rounded-lg border border-line p-3 text-sm">
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                <span className="font-medium text-ink">Analytics</span>
                <span className="block text-muted">Google Analytics — which pages are read, where visitors come from.</span>
              </span>
            </label>
            <label className="flex items-start gap-3 rounded-lg border border-line p-3 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                <span className="font-medium text-ink">Marketing</span>
                <span className="block text-muted">Meta and Google ad measurement — tells us which ads led to a waitlist signup.</span>
              </span>
            </label>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => decide({ analytics: true, marketing: true })}
            className="inline-flex items-center rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-blue"
          >
            Accept all
          </button>
          <button
            type="button"
            onClick={() => decide({ analytics: false, marketing: false })}
            className="inline-flex items-center rounded-full border border-line-strong px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-ink"
          >
            Essential only
          </button>
          {manage ? (
            <button
              type="button"
              onClick={() => decide({ analytics, marketing })}
              className="inline-flex items-center rounded-full border border-line-strong px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-ink"
            >
              Save choices
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setManage(true)}
              className="inline-flex items-center px-3 py-2.5 text-sm font-medium text-muted underline-offset-4 hover:underline"
            >
              Manage
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
