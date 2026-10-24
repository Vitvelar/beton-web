"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  registerCompany,
  type OnboardingFormState,
} from "@/app/(dashboard)/dashboard/onboarding/actions";
import { dashboardCopy, type DashboardLocale } from "@/lib/i18n/dashboard";
import { shellCopy } from "@/lib/i18n/dashboard-shell";
import {
  COMPANY_NAME_MAX,
  WEBSITE_MAX,
  validateCompanyForm,
  type CompanyField,
  type CountryOption,
} from "@/lib/onboarding";
import { btn, field, fieldError as fieldErrorClass, fieldHelp, fieldLabel, spinner } from "@/lib/ui";

// Skráningarform fyrirtækis (app.rondva.com/dashboard/onboarding). Server action
// registerCompany staðfestir allt aftur og kallar á register_company() með setu
// notandans. Vafrinn staðfestir ekki sjálfur (noValidate): sömu mörk eru athuguð hér
// með okkar eigin texta, villa birtist undir reitnum og fókus fer á fyrsta ógilda reit.

const INITIAL: OnboardingFormState = {};
const FIELD_ORDER: CompanyField[] = ["name", "country", "website"];
type FieldErrors = Partial<Record<CompanyField, string>>;
/** Hversu lengi við bíðum eftir að vafrinn fari á næstu síðu áður en formið er opnað aftur. */
const NAVIGATION_TIMEOUT_MS = 8000;

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
  const shell = shellCopy(locale).onboarding;
  const [state, formAction, submitting] = useActionState(registerCompany, INITIAL);
  // Tókst: heil síðuhleðsla svo útlit og haus stjórnborðsins fylgi nýja aðganginum. Formið
  // helst óvirkt á meðan — en festist aldrei: gangi flutningurinn ekki innan tímamarka
  // opnast það aftur með skýringu (aðgerðin er endurtakanleg, „already_registered“).
  const [stalledState, setStalledState] = useState<OnboardingFormState | null>(null);
  const stalled = stalledState === state;
  const pending = submitting || (Boolean(state.next) && !stalled);
  useEffect(() => {
    if (!state.next) return;
    window.location.assign(state.next);
    const timer = window.setTimeout(() => setStalledState(state), NAVIGATION_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [state]);

  // Stýrðir reitir: gildin haldast ef þjónninn skilar villu.
  const [name, setName] = useState("");
  const [country, setCountry] = useState(defaultCountry ?? "");
  const [website, setWebsite] = useState("");
  // Villur úr vafranum (fyrir sendingu); annars þær sem þjónninn skilaði.
  const [clientErrors, setClientErrors] = useState<FieldErrors | null>(null);
  // Reitir sem notandinn er byrjaður að laga: villan hverfur strax, ný villa kemur við næstu sendingu.
  const [fixing, setFixing] = useState<CompanyField[]>([]);
  const shown: FieldErrors = clientErrors ?? state.fieldErrors ?? {};
  const errors: FieldErrors = Object.fromEntries(
    Object.entries(shown).filter(([key]) => !fixing.includes(key as CompanyField))
  );

  const nameRef = useRef<HTMLInputElement>(null);
  const countryRef = useRef<HTMLSelectElement>(null);
  const websiteRef = useRef<HTMLInputElement>(null);
  const refs = { name: nameRef, country: countryRef, website: websiteRef };

  const focusFirstInvalid = (found: FieldErrors) => {
    const first = FIELD_ORDER.find((key) => found[key]);
    if (first) refs[first].current?.focus();
  };

  // Villur frá þjóninum: fókus á fyrsta ógilda reit.
  useEffect(() => {
    if (state.fieldErrors) focusFirstInvalid(state.fieldErrors);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refs eru stöðugir
  }, [state.fieldErrors]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    setFixing([]);
    const parsed = validateCompanyForm({ name, country, website });
    if (parsed.ok) {
      setClientErrors(null);
      return; // þjónninn tekur við (formAction)
    }
    event.preventDefault();
    const { name: n, country: c, website: w } = parsed.errors;
    const found: FieldErrors = {
      ...(n ? { name: n === "required" ? t.nameRequired : t.nameLength } : {}),
      ...(c ? { country: t.countryRequired } : {}),
      ...(w ? { website: t.websiteInvalid } : {}),
    };
    setClientErrors(found);
    focusFirstInvalid(found);
  }

  // Villan hverfur þegar notandinn byrjar að laga reitinn.
  const clearError = (key: CompanyField) => setFixing((prev) => (prev.includes(key) ? prev : [...prev, key]));

  const describedBy = (key: CompanyField) =>
    [`company-${key}-hint`, errors[key] ? `company-${key}-error` : null].filter(Boolean).join(" ");

  const errorMessage = (key: CompanyField) =>
    errors[key] ? (
      <p id={`company-${key}-error`} role="alert" className={fieldErrorClass}>
        {errors[key]}
      </p>
    ) : null;

  return (
    <form action={formAction} onSubmit={onSubmit} noValidate className="mt-8 space-y-6">
      {state.formError ? (
        <p
          role="alert"
          className="rounded-xl border border-danger bg-danger-tint px-4 py-3.5 text-sm leading-relaxed text-danger"
        >
          {state.formError}
        </p>
      ) : null}
      {stalled ? (
        <p
          role="alert"
          className="rounded-xl border border-danger bg-danger-tint px-4 py-3.5 text-sm leading-relaxed text-danger"
        >
          {shell.navStalled}
        </p>
      ) : null}

      <div>
        <label htmlFor="company-name" className={fieldLabel}>
          {t.nameLabel}
        </label>
        <input
          ref={nameRef}
          id="company-name"
          name="name"
          type="text"
          required
          aria-required="true"
          maxLength={COMPANY_NAME_MAX}
          autoComplete="organization"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            clearError("name");
          }}
          placeholder={t.namePlaceholder}
          disabled={pending}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={describedBy("name")}
          className={field("box")}
        />
        <p id="company-name-hint" className={fieldHelp}>
          {t.nameHint}
        </p>
        {errorMessage("name")}
      </div>

      <div>
        <label htmlFor="company-country" className={fieldLabel}>
          {t.countryLabel}
        </label>
        <div className="relative">
          <select
            ref={countryRef}
            id="company-country"
            name="country"
            required
            aria-required="true"
            autoComplete="country"
            value={country}
            onChange={(e) => {
              setCountry(e.target.value);
              clearError("country");
            }}
            disabled={pending}
            aria-invalid={errors.country ? true : undefined}
            aria-describedby={describedBy("country")}
            className={field("box", `appearance-none pr-11 ${country ? "" : "text-fog!"}`)}
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
            className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-fog"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p id="company-country-hint" className={fieldHelp}>
          {t.countryHint}
        </p>
        {errorMessage("country")}
      </div>

      <div>
        <label htmlFor="company-website" className={fieldLabel}>
          {t.websiteLabel} <span className="font-normal text-fog">({t.optional})</span>
        </label>
        <input
          ref={websiteRef}
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
          onChange={(e) => {
            setWebsite(e.target.value);
            clearError("website");
          }}
          placeholder={t.websitePlaceholder}
          disabled={pending}
          aria-invalid={errors.website ? true : undefined}
          aria-describedby={describedBy("website")}
          className={field("box")}
        />
        <p id="company-website-hint" className={fieldHelp}>
          {t.websiteHint}
        </p>
        {errorMessage("website")}
      </div>

      <button type="submit" disabled={pending} aria-busy={pending} className={btn("primary", "lg", "w-full")}>
        {pending ? <span className={spinner} aria-hidden="true" /> : null}
        {pending ? t.submitting : t.submit}
      </button>
    </form>
  );
}
