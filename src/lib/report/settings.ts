import { isReportLocale, type ReportLocale } from "./i18n";

// Tungumál og matskerfi skýrslu fyrirtækis (companies.report_locale / rating_scheme,
// beton-app flutningur 20260927…_company_report_language). null = sjálfgefið eftir landi.
// SAMA regla er í beton-app supabase/functions/generate-report/report-settings.ts —
// breyta báðum saman. Edge-fallið stimplar niðurstöðuna í ai_report_data; hér er hún
// notuð til að sýna virk gildi á stillingasíðunni.

export const RATING_SCHEMES = ["standard", "condition_1_3"] as const;
export type RatingScheme = (typeof RATING_SCHEMES)[number];

export function isRatingScheme(value: unknown): value is RatingScheme {
  return (RATING_SCHEMES as readonly unknown[]).includes(value);
}

export interface ReportSettings {
  locale: ReportLocale;
  scheme: RatingScheme;
}

const CONDITION_RATING_COUNTRIES = new Set(["GB", "IE"]);

export function resolveReportSettings(
  company: { report_locale?: unknown; rating_scheme?: unknown; country_code?: unknown } | null | undefined,
): ReportSettings {
  if (!company) return { locale: "is", scheme: "standard" };
  const country = typeof company.country_code === "string" ? company.country_code.trim().toUpperCase() : "";
  return {
    locale: isReportLocale(company.report_locale) ? company.report_locale : country === "IS" ? "is" : "en",
    scheme: isRatingScheme(company.rating_scheme)
      ? company.rating_scheme
      : CONDITION_RATING_COUNTRIES.has(country) ? "condition_1_3" : "standard",
  };
}

/** Matskerfi vistaðrar skýrslu; engin/óþekkt gildi = núverandi kerfi (eldri skýrslur). */
export function ratingSchemeOf(report: { rating_scheme?: unknown } | null | undefined): RatingScheme {
  return isRatingScheme(report?.rating_scheme) ? report.rating_scheme : "standard";
}
