"use client";

import { useSyncExternalStore } from "react";
import { dashboardCopy, isDashboardLocale } from "@/lib/i18n/dashboard";

// Beinagrind á meðan síða hleðst (loading.tsx). Texti fyrir skjálesara kemur úr <html lang>
// (sama tungumál og stjórnborðið) án þess að bíða eftir gögnum; á þjóninum er hann tómur.
const noop = () => () => {};
const readLang = () => document.documentElement.lang;
const serverLang = () => "";

function Block({ className = "" }: { className?: string }) {
  return <div className={`rounded-lg bg-paper-alt animate-pulse motion-reduce:animate-none ${className}`} />;
}

export function LoadingSkeleton({ variant = "page" }: { variant?: "page" | "detail" | "form" | "settings" }) {
  const lang = useSyncExternalStore(noop, readLang, serverLang);
  const label = lang ? dashboardCopy(isDashboardLocale(lang) ? lang : "is").common.loading : "";

  return (
    <div role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true">
        <Block className="mb-2 h-4 w-24" />
        <Block className="mb-2 h-7 w-64 max-w-full" />
        <Block className="mb-6 h-4 w-40" />
        {variant === "detail" ? (
          <>
            <div className="mb-6 grid grid-cols-3 gap-3">
              <Block className="h-20" />
              <Block className="h-20" />
              <Block className="h-20" />
            </div>
            <Block className="mb-6 h-28" />
            <Block className="mb-3 h-16" />
            <Block className="h-16" />
          </>
        ) : variant === "form" ? (
          <div className="space-y-5 rounded-xl border border-concrete bg-surface p-6">
            <Block className="h-11" />
            <Block className="h-11" />
            <Block className="h-40" />
            <Block className="h-11 w-40" />
          </div>
        ) : variant === "settings" ? (
          <div className="max-w-2xl space-y-6">
            <Block className="h-32" />
            <Block className="h-72" />
          </div>
        ) : (
          <div className="space-y-3">
            <Block className="h-12" />
            <Block className="h-12" />
            <Block className="h-12" />
            <Block className="h-12" />
          </div>
        )}
      </div>
    </div>
  );
}
