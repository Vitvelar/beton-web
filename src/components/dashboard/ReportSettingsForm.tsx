"use client";

import { useState, useTransition } from "react";
import { saveReportSettings, saveReportStandard } from "@/app/(dashboard)/actions";
import { dashboardCopy, LOCALE_NAMES, type DashboardLocale } from "@/lib/i18n/dashboard";
import { REPORT_LOCALES, type ReportLocale } from "@/lib/report/i18n";
import type { RatingScheme, ReportStandard } from "@/lib/report/settings";
import { field, fieldHelp, fieldLabel } from "@/lib/ui";

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
  initial: { reportLocale: ReportLocale; ratingScheme: RatingScheme; reportStandard: ReportStandard; standardSupported: boolean; isopAvailable: boolean; texas: boolean };
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
  const showIsop = initial.isopAvailable || value.reportStandard === "isop";

  function change(next: Values) {
    setValue(next);
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await saveReportSettings(next.reportLocale, next.ratingScheme);
        if ("error" in result) {
          setValue(saved);
          setMessage({ kind: "error", text: result.error });
        } else {
          setSaved(next);
          setMessage({ kind: "ok", text: t.saved });
        }
      } catch {
        setValue(saved);
        setMessage({ kind: "error", text: t.saveFailed });
      }
    });
  }

  function changeStandard(reportStandard: string) {
    const next = { ...value, reportStandard };
    setValue(next);
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await saveReportStandard(reportStandard);
        if ("error" in result) {
          setValue(saved);
          setMessage({ kind: "error", text: result.error });
        } else {
          // Matskerfi án skráðs gildis fylgir sniðinu — sýna virku gildin eftir vistun.
          let now = result.settings ?? next;
          // Home inspection fer með eigin matsorð; aðrir sniðvalkostir losa það aftur (aðeins ef skráð).
          const wanted = reportStandard === "isop" ? "isop_terms" : saved.ratingScheme === "isop_terms" ? (reportStandard === "nzs_4306" ? "nz_terms" : "standard") : null;
          if (wanted && now.ratingScheme !== wanted) {
            const paired = await saveReportSettings(now.reportLocale, wanted);
            if ("error" in paired) {
              setMessage({ kind: "error", text: paired.error });
              setSaved(now);
              setValue(now);
              return;
            }
            now = { ...now, ratingScheme: wanted };
          }
          setSaved(now);
          setValue(now);
          setMessage({ kind: "ok", text: t.saved });
        }
      } catch {
        setValue(saved);
        setMessage({ kind: "error", text: t.saveFailed });
      }
    });
  }

  const labelCls = fieldLabel;
  const selectCls = field("box", "max-w-xs");

  return (
    <div className="mb-6 space-y-5 rounded-xl border border-concrete bg-surface p-6">
      <h2 className="text-base font-semibold text-ink">{t.title}</h2>
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
            aria-describedby="report_standard_hint"
            className={selectCls}
          >
            <option value="default">{t.standardDefault}</option>
            <option value="nzs_4306">{t.standardNzs}</option>
            {showIsop ? <option value="isop">{t.standardIsop}</option> : null}
          </select>
          <p id="report_standard_hint" className={fieldHelp}>{value.reportStandard === "isop" ? t.isopHint : t.standardHint}</p>
          {value.reportStandard === "isop" && initial.texas ? (
            <p role="note" className="mt-2 rounded-md border border-concrete-dk bg-concrete px-3 py-2 text-xs text-ink">
              {t.texasNotice}
            </p>
          ) : null}
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
          aria-describedby="report_locale_hint"
          className={selectCls}
        >
          {REPORT_LOCALES.map((code) => (
            <option key={code} value={code} lang={code}>
              {LOCALE_NAMES[code]}
            </option>
          ))}
        </select>
        <p id="report_locale_hint" className={fieldHelp}>{t.languageHint}</p>
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
          aria-describedby="rating_scheme_hint"
          className={selectCls}
        >
          <option value="standard">{t.schemeStandard}</option>
          <option value="condition_1_3">{t.schemeCondition}</option>
          {showNz ? <option value="nz_terms">{t.schemeNz}</option> : null}
          {showIsop ? <option value="isop_terms">{t.schemeIsop}</option> : null}
        </select>
        <p id="rating_scheme_hint" className={fieldHelp}>{t.schemeHint}</p>
      </div>
      <div className="min-h-5 text-sm">
        <p role="status" className="text-fog">{isPending ? t.saving : message?.kind === "ok" ? <span className="text-success">{message.text}</span> : null}</p>
        {message?.kind === "error" ? <p role="alert" className="text-danger">{message.text}</p> : null}
      </div>
    </div>
  );
}
