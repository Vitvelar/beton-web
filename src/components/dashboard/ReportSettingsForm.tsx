"use client";

import { useState, useTransition } from "react";
import { saveReportSettings } from "@/app/(dashboard)/actions";
import { dashboardCopy, LOCALE_NAMES, type DashboardLocale } from "@/lib/i18n/dashboard";
import { REPORT_LOCALES, type ReportLocale } from "@/lib/report/i18n";
import type { RatingScheme } from "@/lib/report/settings";

// Skýrslumál og matskerfi fyrirtækis (aðeins eigandi, app.rondva.com). Gildir um nýjar
// skýrslur: edge-fallið stimplar valið í hverja skýrslu þegar hún er gerð.
export function ReportSettingsForm({
  locale,
  initial,
}: {
  locale: DashboardLocale;
  initial: { reportLocale: ReportLocale; ratingScheme: RatingScheme };
}) {
  const t = dashboardCopy(locale).reportSettings;
  const [reportLocale, setReportLocale] = useState<string>(initial.reportLocale);
  const [ratingScheme, setRatingScheme] = useState<string>(initial.ratingScheme);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await saveReportSettings(reportLocale, ratingScheme);
      setMessage("error" in result ? { kind: "error", text: result.error } : { kind: "ok", text: t.saved });
    });
  }

  const labelCls = "block text-xs font-mono uppercase tracking-wider text-fog mb-1.5";
  const selectCls =
    "w-full max-w-xs rounded-md border border-concrete-dk bg-white px-3 py-2 text-sm text-ink focus:border-navy focus:outline-none disabled:opacity-60";

  return (
    <form onSubmit={onSubmit} className="mb-6 space-y-5 rounded-xl border border-concrete bg-white p-6">
      <h2 className="text-sm font-semibold text-ink">{t.title}</h2>
      <div>
        <label htmlFor="report_locale" className={labelCls}>
          {t.language}
        </label>
        <select
          id="report_locale"
          value={reportLocale}
          disabled={isPending}
          onChange={(e) => setReportLocale(e.target.value)}
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
          value={ratingScheme}
          disabled={isPending}
          onChange={(e) => setRatingScheme(e.target.value)}
          className={selectCls}
        >
          <option value="standard">{t.schemeStandard}</option>
          <option value="condition_1_3">{t.schemeCondition}</option>
        </select>
        <p className="mt-1 text-xs text-fog">{t.schemeHint}</p>
      </div>
      {message ? (
        <p className={`text-sm ${message.kind === "ok" ? "text-emerald-700" : "text-sev-danger"}`}>{message.text}</p>
      ) : null}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-navy px-5 py-2 text-sm font-semibold text-white hover:bg-navy-deep disabled:opacity-50"
      >
        {isPending ? t.saving : t.save}
      </button>
    </form>
  );
}
