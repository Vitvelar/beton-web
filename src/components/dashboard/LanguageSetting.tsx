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
import { field, fieldError, fieldHelp, fieldLabel } from "@/lib/ui";

// Tungumálaval á stillingasíðunni (aðeins Rondva). Vistast í user_metadata og
// gildir líka í appinu; síðan birtist strax aftur á valda málinu.
export function LanguageSetting({ locale }: { locale: DashboardLocale }) {
  const t = dashboardCopy(locale).language;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // Valið sést strax; fer til baka ef vistun mistekst.
  const [selected, setSelected] = useState<string>(locale);

  function onChange(next: string) {
    setError(null);
    setSelected(next);
    startTransition(async () => {
      try {
        const result = await setDashboardLocale(next);
        if ("error" in result) {
          setError(result.error);
          setSelected(locale);
        } else router.refresh();
      } catch {
        setError(t.saveFailed);
        setSelected(locale);
      }
    });
  }

  return (
    <div className="mb-6 rounded-xl border border-concrete bg-surface p-6">
      <label htmlFor="dashboard_locale" className={fieldLabel}>
        {t.title}
      </label>
      <select
        id="dashboard_locale"
        value={selected}
        disabled={isPending}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={error ? "dashboard_locale_error" : "dashboard_locale_hint"}
        aria-invalid={error ? true : undefined}
        aria-busy={isPending}
        className={field("box", "max-w-xs")}
      >
        {DASHBOARD_LOCALES.map((code) => (
          <option key={code} value={code} lang={code}>
            {LOCALE_NAMES[code]}
          </option>
        ))}
      </select>
      <p id="dashboard_locale_hint" className={fieldHelp}>{t.hint}</p>
      {error ? <p id="dashboard_locale_error" role="alert" className={fieldError}>{error}</p> : null}
    </div>
  );
}
