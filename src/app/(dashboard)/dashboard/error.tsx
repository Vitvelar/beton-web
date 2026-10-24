"use client";

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { dashboardCopy, format, isDashboardLocale } from "@/lib/i18n/dashboard";
import { btn } from "@/lib/ui";

// Villumörk stjórnborðsins (DESIGN.md §7). Liggur undir (dashboard)/layout.tsx, svo haus og
// leiðsögn haldast. Tungumálið kemur úr <html lang> (sama og stjórnborðið; litirnir úr
// data-brand eru þegar á <html>), því client-íhlutur sér ekki beiðnina. Á þjóninum er
// niðurstaðan tóm og textinn falinn þar til hann er kominn á skjáinn.
const noop = () => () => {};
const readLang = () => document.documentElement.lang;
const serverLang = () => "";

export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const lang = useSyncExternalStore(noop, readLang, serverLang);
  useEffect(() => {
    console.error(error);
  }, [error]);

  const t = dashboardCopy(isDashboardLocale(lang) ? lang : "is");

  return (
    <div role="alert" className={`max-w-xl py-6 ${lang ? "" : "invisible"}`}>
      <h1 className="text-2xl font-semibold text-ink">{t.errorPage.title}</h1>
      <p className="mt-2 text-sm text-fog">{t.errorPage.body}</p>
      {error.digest ? (
        <p className="mt-2 text-xs text-fog">{format(t.errorPage.reference, { digest: error.digest })}</p>
      ) : null}
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={() => unstable_retry()} className={btn("primary")}>
          {t.errorPage.retry}
        </button>
        <Link href="/dashboard" className={btn("secondary")}>
          {t.common.backToInspections}
        </Link>
      </div>
    </div>
  );
}
