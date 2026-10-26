"use client";

import { useState, useTransition } from "react";
import { saveCompanyCountry } from "@/app/(dashboard)/actions";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { reportFormatAfterCountry, selectableCountries } from "@/lib/company-country";
import { dashboardCopy, format, type DashboardLocale } from "@/lib/i18n/dashboard";
import type { CountryOption } from "@/lib/onboarding";
import { field, fieldHelp, fieldLabel } from "@/lib/ui";

// Land fyrirtækis (aðeins eigandi, app.rondva.com — settings/page.tsx birtir þetta aldrei fyrir Beton).
// Valið opnar staðfestingu; fyrst þegar eigandinn staðfestir fer set_company_country() af stað. Engin skoðun er
// endurskrifuð: vistuð gildi haldast, reglur og textar fylgja nýja landinu frá næstu birtingu.
export function CompanyCountryForm({
  locale,
  country,
  countries,
}: {
  locale: DashboardLocale;
  country: string;
  countries: CountryOption[];
}) {
  const t = dashboardCopy(locale).companyCountry;
  const [saved, setSaved] = useState(country);
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const nameOf = (code: string) => countries.find((c) => c.code === code)?.name ?? code;

  function confirm() {
    const next = pending;
    if (!next) return;
    startTransition(async () => {
      try {
        const result = await saveCompanyCountry(next);
        if ("error" in result) {
          setMessage({ kind: "error", text: result.error });
        } else {
          setSaved(result.country);
          setMessage({ kind: "ok", text: format(t.saved, { country: nameOf(result.country) }) });
        }
      } catch {
        setMessage({ kind: "error", text: t.failed });
      } finally {
        setPending(null);
      }
    });
  }

  const after = pending ? reportFormatAfterCountry(pending) : null;

  return (
    <div className="mb-6 rounded-xl border border-concrete bg-surface p-6">
      <label htmlFor="company_country" className={fieldLabel}>
        {t.label}
      </label>
      <select
        id="company_country"
        value={saved}
        disabled={isPending}
        onChange={(e) => {
          setMessage(null);
          if (e.target.value && e.target.value !== saved) setPending(e.target.value);
        }}
        aria-describedby="company_country_hint"
        className={field("box", "max-w-xs")}
      >
        {saved ? null : <option value="" disabled />}
        {selectableCountries(countries, saved).map((option) => (
          <option key={option.code} value={option.code}>
            {option.name}
          </option>
        ))}
      </select>
      <p id="company_country_hint" className={fieldHelp}>
        {t.hint}
      </p>
      <div className="mt-3 min-h-5 text-sm">
        <p role="status" className="text-fog">
          {isPending ? t.saving : message?.kind === "ok" ? <span className="text-success">{message.text}</span> : null}
        </p>
        {message?.kind === "error" ? (
          <p role="alert" className="text-danger">
            {message.text}
          </p>
        ) : null}
      </div>
      <ConfirmDialog
        open={pending !== null}
        title={format(t.confirmTitle, { country: pending ? nameOf(pending) : "" })}
        confirmLabel={t.confirm}
        cancelLabel={t.cancel}
        onConfirm={confirm}
        onCancel={() => setPending(null)}
        busy={isPending}
      >
        <p>{format(t.confirmBody, { country: pending ? nameOf(pending) : "" })}</p>
        {after ? (
          <p>
            {format(t.formatAfter, {
              format: after === "isop" ? t.formatIsop : after === "nzs_4306" ? t.formatNzs : t.formatStandard,
            })}
          </p>
        ) : null}
      </ConfirmDialog>
    </div>
  );
}
