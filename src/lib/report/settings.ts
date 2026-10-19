import { isReportLocale, type ReportLocale } from "./i18n";
import { type EnglishVariant, resolveEnglishVariant } from "./english-variant";

// Tungumál, matskerfi og skýrslusnið fyrirtækis (companies.report_locale / rating_scheme /
// report_standard, beton-app flutningar 20260927…_company_report_language og NZS 4306).
// null = sjálfgefið eftir landi. SAMA regla er í beton-app
// supabase/functions/generate-report/report-settings.ts — breyta báðum saman
// (samningur: plan/rondva/NZ-SKYRSLUSNID-HONNUN.md). Edge-fallið stimplar niðurstöðuna í
// ai_report_data; hér er hún notuð til að sýna virk gildi á stillingasíðunni.

export const REPORT_STANDARDS = ["default", "nzs_4306"] as const;
export type ReportStandard = (typeof REPORT_STANDARDS)[number];

export const RATING_SCHEMES = ["standard", "condition_1_3", "nz_terms"] as const;
export type RatingScheme = (typeof RATING_SCHEMES)[number];

export function isReportStandard(value: unknown): value is ReportStandard {
  return (REPORT_STANDARDS as readonly unknown[]).includes(value);
}

export function isRatingScheme(value: unknown): value is RatingScheme {
  return (RATING_SCHEMES as readonly unknown[]).includes(value);
}

export interface ReportSettings {
  locale: ReportLocale;
  scheme: RatingScheme;
  standard: ReportStandard;
  /** Aðeins á ensku: afbrigði eftir landi (english-variant.ts). Íslenska fær engan lykil. */
  englishVariant?: EnglishVariant;
}

/** Eldri skýrslur og notendur án fyrirtækis: nákvæmlega eins og fyrir breytinguna. */
export const LEGACY_REPORT_SETTINGS: ReportSettings = { locale: "is", scheme: "standard", standard: "default" };

const CONDITION_RATING_COUNTRIES = new Set(["GB", "IE"]);

export function resolveReportSettings(
  company:
    | { report_locale?: unknown; rating_scheme?: unknown; report_standard?: unknown; country_code?: unknown }
    | null
    | undefined,
): ReportSettings {
  if (!company) return { ...LEGACY_REPORT_SETTINGS };
  const country = typeof company.country_code === "string" ? company.country_code.trim().toUpperCase() : "";
  const standard: ReportStandard = isReportStandard(company.report_standard)
    ? company.report_standard
    : country === "NZ" ? "nzs_4306" : "default";
  const locale: ReportLocale = isReportLocale(company.report_locale) ? company.report_locale : country === "IS" ? "is" : "en";
  const scheme: RatingScheme = isRatingScheme(company.rating_scheme)
    ? company.rating_scheme
    : standard === "nzs_4306" ? "nz_terms" : CONDITION_RATING_COUNTRIES.has(country) ? "condition_1_3" : "standard";
  return locale === "en"
    ? { locale, scheme, standard, englishVariant: resolveEnglishVariant(country) }
    : { locale, scheme, standard };
}

/** Matskerfi vistaðrar skýrslu; engin/óþekkt gildi = núverandi kerfi (eldri skýrslur). */
export function ratingSchemeOf(report: { rating_scheme?: unknown } | null | undefined): RatingScheme {
  return isRatingScheme(report?.rating_scheme) ? report.rating_scheme : "standard";
}

/** Skýrslusnið vistaðrar skýrslu (ai_report_data.report_standard); vantar = núverandi snið. */
export function reportStandardOf(report: { report_standard?: unknown } | null | undefined): ReportStandard {
  return isReportStandard(report?.report_standard) ? report.report_standard : "default";
}
