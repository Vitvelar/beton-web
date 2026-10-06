"use client";

import { useActionState, useEffect, useState } from "react";
import {
  registerCompany,
  type OnboardingFormState,
} from "@/app/(dashboard)/dashboard/onboarding/actions";
import { dashboardCopy, type DashboardLocale } from "@/lib/i18n/dashboard";
import {
  COMPANY_NAME_MAX,
  COMPANY_NAME_MIN,
  WEBSITE_MAX,
  type CompanyField,
  type CountryOption,
} from "@/lib/onboarding";

// Skráningarform fyrirtækis (app.rondva.com/dashboard/onboarding). Server action
// registerCompany staðfestir allt aftur og kallar á register_company() með setu
// notandans; hér eru aðeins sömu mörk í HTML svo villur sjáist strax.

const INITIAL: OnboardingFormState = {};

const inputClass = (invalid: boolean) =>
  `mt-1.5 block h-12 w-full rounded-xl border bg-white px-4 text-[15px] text-ink placeholder:text-fog/60 transition-colors focus:border-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/20 disabled:opacity-60 ${
    invalid ? "border-sev-danger" : "border-concrete-dk"
  }`;

export function CompanyOnboardingForm({
  locale,
  countries,
  defaultCountry,
}: {
  locale: DashboardLocale;
  countries: CountryOption[];
  /** Úr Accept-Language vafrans (t.d. en-GB → GB); tómt ef ekkert land fannst. */
  defaultCountry: string | null;
}) {
  const t = dashboardCopy(locale).onboarding;
  const [state, formAction, submitting] = useActionState(registerCompany, INITIAL);
  // Tókst (eða setan rann út): heil síðuhleðsla svo útlit og haus stjórnborðsins
  // fylgi nýja aðganginum. Formið helst óvirkt á meðan.
  const pending = submitting || Boolean(state.next);
  useEffect(() => {
    if (state.next) window.location.assign(state.next);
  }, [state.next]);
  // Stýrðir reitir: gildin haldast ef þjónninn skilar villu.
  const [name, setName] = useState("");
  const [country, setCountry] = useState(defaultCountry ?? "");
  const [website, setWebsite] = useState("");
  const errors = state.fieldErrors ?? {};

  const describedBy = (field: CompanyField, hint: boolean) =>
    [hint ? `company-${field}-hint` : null, errors[field] ? `company-${field}-error` : null]
      .filter(Boolean)
      .join(" ") || undefined;

  const fieldError = (field: CompanyField) =>
    errors[field] ? (
      <p id={`company-${field}-error`} className="mt-1.5 text-sm text-sev-danger">
        {errors[field]}
      </p>
    ) : null;

  return (
    <form action={formAction} className="mt-8 space-y-6">
      {state.formError ? (
        <p
          role="alert"
          className="rounded-xl border border-sev-danger/30 bg-white px-4 py-3.5 text-sm leading-relaxed text-sev-danger"
        >
          {state.formError}
        </p>
      ) : null}

      <div>
        <label htmlFor="company-name" className="block text-sm font-semibold text-ink">
          {t.nameLabel}
        </label>
        <input
          id="company-name"
          name="name"
          type="text"
          required
          minLength={COMPANY_NAME_MIN}
          maxLength={COMPANY_NAME_MAX}
          autoComplete="organization"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.namePlaceholder}
          disabled={pending}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={describedBy("name", true)}
          className={inputClass(Boolean(errors.name))}
        />
        <p id="company-name-hint" className="mt-1.5 text-xs leading-relaxed text-fog">
          {t.nameHint}
        </p>
        {fieldError("name")}
      </div>

      <div>
        <label htmlFor="company-country" className="block text-sm font-semibold text-ink">
          {t.countryLabel}
        </label>
        <div className="relative">
          <select
            id="company-country"
            name="country"
            required
            autoComplete="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            disabled={pending}
            aria-invalid={errors.country ? true : undefined}
            aria-describedby={describedBy("country", true)}
            className={`${inputClass(Boolean(errors.country))} appearance-none pr-11 ${country ? "" : "text-fog"}`}
          >
            <option value="" disabled>
              {t.countryPlaceholder}
            </option>
            {countries.map((option) => (
              <option key={option.code} value={option.code} className="text-ink">
                {option.name}
              </option>
            ))}
          </select>
          <svg
            className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-fog"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p id="company-country-hint" className="mt-1.5 text-xs leading-relaxed text-fog">
          {t.countryHint}
        </p>
        {fieldError("country")}
      </div>

      <div>
        <label htmlFor="company-website" className="block text-sm font-semibold text-ink">
          {t.websiteLabel} <span className="font-normal text-fog">({t.optional})</span>
        </label>
        <input
          id="company-website"
          name="website"
          type="text"
          inputMode="url"
          autoComplete="url"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          maxLength={WEBSITE_MAX}
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder={t.websitePlaceholder}
          disabled={pending}
          aria-invalid={errors.website ? true : undefined}
          aria-describedby={describedBy("website", true)}
          className={inputClass(Boolean(errors.website))}
        />
        <p id="company-website-hint" className="mt-1.5 text-xs leading-relaxed text-fog">
          {t.websiteHint}
        </p>
        {fieldError("website")}
      </div>

      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="flex h-12 w-full items-center justify-center rounded-full bg-navy px-6 text-[15px] font-semibold text-white transition-colors hover:bg-navy-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? t.submitting : t.submit}
      </button>
    </form>
  );
}
