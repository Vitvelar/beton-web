"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setDashboardLocale } from "@/app/(dashboard)/actions";
import {
  DASHBOARD_LOCALES,
  LOCALE_NAMES,
  dashboardCopy,
  type DashboardLocale,
} from "@/lib/i18n/dashboard";

// Tungumálaval á stillingasíðunni (aðeins Rondva). Vistast í user_metadata og
// gildir líka í appinu; síðan birtist strax aftur á valda málinu.
export function LanguageSetting({ locale }: { locale: DashboardLocale }) {
  const t = dashboardCopy(locale).language;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onChange(next: string) {
    setError(null);
    startTransition(async () => {
      const result = await setDashboardLocale(next);
      if ("error" in result) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="mb-6 rounded-xl border border-concrete bg-white p-6">
      <label
        htmlFor="dashboard_locale"
        className="block text-xs font-mono uppercase tracking-wider text-fog mb-1.5"
      >
        {t.title}
      </label>
      <select
        id="dashboard_locale"
        value={locale}
        disabled={isPending}
        onChange={(e) => onChange(e.target.value)}
        className="w-full max-w-xs rounded-md border border-concrete-dk bg-white px-3 py-2 text-sm text-ink focus:border-navy focus:outline-none disabled:opacity-60"
      >
        {DASHBOARD_LOCALES.map((code) => (
          <option key={code} value={code} lang={code}>
            {LOCALE_NAMES[code]}
          </option>
        ))}
      </select>
      <p className="mt-1 text-xs text-fog">{t.hint}</p>
      {error ? <p className="mt-2 text-sm text-sev-danger">{error}</p> : null}
    </div>
  );
}
