"use client";

import { useState, useTransition } from "react";
import { saveReportSettings, saveReportStandard } from "@/app/(dashboard)/actions";
import { dashboardCopy, LOCALE_NAMES, type DashboardLocale } from "@/lib/i18n/dashboard";
import { REPORT_LOCALES, type ReportLocale } from "@/lib/report/i18n";
import type { RatingScheme, ReportStandard } from "@/lib/report/settings";

// Skýrslumál, matskerfi og skýrslusnið fyrirtækis (aðeins eigandi, app.rondva.com).
// Vistast um leið og valið breytist (engin Vista-hnappur); fer til baka ef vistun
// mistekst. Gildir um nýjar skýrslur: edge-fallið stimplar valið í hverja skýrslu þegar
// hún er gerð. Skýrslusniðið og NZ-matsorðin sjást aðeins þegar NZS 4306-flutningurinn er
// kominn í gagnagrunninn (`standardSupported`).
type Values = { reportLocale: string; ratingScheme: string; reportStandard: string };

export function ReportSettingsForm({
  locale,
  initial,
}: {
  locale: DashboardLocale;
  initial: { reportLocale: ReportLocale; ratingScheme: RatingScheme; reportStandard: ReportStandard; standardSupported: boolean };
}) {
  const t = dashboardCopy(locale).reportSettings;
  const [saved, setSaved] = useState<Values>({
    reportLocale: initial.reportLocale,
    ratingScheme: initial.ratingScheme,
    reportStandard: initial.reportStandard,
  });
  const [value, setValue] = useState(saved);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const showNz = initial.standardSupported || value.ratingScheme === "nz_terms";

  function change(next: Values) {
    setValue(next);
    setMessage(null);
    startTransition(async () => {
      const result = await saveReportSettings(next.reportLocale, next.ratingScheme);
      if ("error" in result) {
        setValue(saved);
        setMessage({ kind: "error", text: result.error });
      } else {
        setSaved(next);
        setMessage({ kind: "ok", text: t.saved });
      }
    });
  }

  function changeStandard(reportStandard: string) {
    const next = { ...value, reportStandard };
    setValue(next);
    setMessage(null);
    startTransition(async () => {
      const result = await saveReportStandard(reportStandard);
      if ("error" in result) {
        setValue(saved);
        setMessage({ kind: "error", text: result.error });
      } else {
        // Matskerfi án skráðs gildis fylgir sniðinu — sýna virku gildin eftir vistun.
        const now = result.settings ?? next;
        setSaved(now);
        setValue(now);
        setMessage({ kind: "ok", text: t.saved });
      }
    });
  }

  const labelCls = "block text-xs font-mono uppercase tracking-wider text-fog mb-1.5";
  const selectCls =
    "w-full max-w-xs rounded-md border border-concrete-dk bg-white px-3 py-2 text-sm text-ink focus:border-navy focus:outline-none disabled:opacity-60";

  return (
    <div className="mb-6 space-y-5 rounded-xl border border-concrete bg-white p-6">
      <h2 className="text-sm font-semibold text-ink">{t.title}</h2>
      {initial.standardSupported ? (
        <div>
          <label htmlFor="report_standard" className={labelCls}>
            {t.standard}
          </label>
          <select
            id="report_standard"
            value={value.reportStandard}
            disabled={isPending}
            onChange={(e) => changeStandard(e.target.value)}
            className={selectCls}
          >
            <option value="default">{t.standardDefault}</option>
            <option value="nzs_4306">{t.standardNzs}</option>
          </select>
          <p className="mt-1 text-xs text-fog">{t.standardHint}</p>
        </div>
      ) : null}
      <div>
        <label htmlFor="report_locale" className={labelCls}>
          {t.language}
        </label>
        <select
          id="report_locale"
          value={value.reportLocale}
          disabled={isPending}
          onChange={(e) => change({ ...value, reportLocale: e.target.value })}
          className={selectCls}
        >
          {REPORT_LOCALES.map((code) => (
            <option key={code} value={code} lang={code}>
              {LOCALE_NAMES[code]}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-fog">{t.languageHint}</p>
      </div>
      <div>
        <label htmlFor="rating_scheme" className={labelCls}>
          {t.scheme}
        </label>
        <select
          id="rating_scheme"
          value={value.ratingScheme}
          disabled={isPending}
          onChange={(e) => change({ ...value, ratingScheme: e.target.value })}
          className={selectCls}
        >
          <option value="standard">{t.schemeStandard}</option>
          <option value="condition_1_3">{t.schemeCondition}</option>
          {showNz ? <option value="nz_terms">{t.schemeNz}</option> : null}
        </select>
        <p className="mt-1 text-xs text-fog">{t.schemeHint}</p>
      </div>
      <p role="status" aria-live="polite" className={`min-h-5 text-sm ${message?.kind === "error" ? "text-sev-danger" : "text-emerald-700"}`}>
        {isPending ? t.saving : message?.text ?? ""}
      </p>
    </div>
  );
}
