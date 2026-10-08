import { formatReportDate } from "./date";

// Enskt afbrigði eftir landi fyrirtækis (Phase 1, samningur plan/rondva/ENSK-AFBRIGDI-HONNUN.md).
// SAMI samningur og beton-app supabase/functions/generate-report/report-settings.ts og appið
// (sömu nöfn og gildi). Ræðst eingöngu af companies.country_code þegar skýrslumálið er enska.
//
// Vistuð skýrsla: edge-fallið stimplar ai_report_data.english_variant AÐEINS fyrir þekkt afbrigði.
// Enginn/ógildur stimpill = 'en' = nákvæmlega eins og áður (dd.mm.yyyy, bresk stafsetning). Eldri
// skýrslur eru ALDREI endurtúlkaðar eftir núverandi landi fyrirtækis: textinn í þeim (inngangur
// með dagsetningu) var skrifaður á gamla forminu og birtingin á að passa við hann.

export const ENGLISH_VARIANTS = ["en-NZ", "en-AU", "en-GB", "en-IE", "en-US", "en-CA", "en"] as const;
export type EnglishVariant = (typeof ENGLISH_VARIANTS)[number];

const ENGLISH_VARIANT_BY_COUNTRY: Readonly<Record<string, EnglishVariant>> = {
  NZ: "en-NZ", AU: "en-AU", GB: "en-GB", IE: "en-IE", US: "en-US", CA: "en-CA",
};

export function isEnglishVariant(value: unknown): value is EnglishVariant {
  return typeof value === "string" && (ENGLISH_VARIANTS as readonly string[]).includes(value);
}

/** Land (ISO 3166-1 alpha-2; há-/lágstafir og bil leyfð) → enskt afbrigði; annað → 'en'. */
export function resolveEnglishVariant(countryCode: unknown): EnglishVariant {
  const country = typeof countryCode === "string" ? countryCode.trim().toUpperCase() : "";
  return Object.hasOwn(ENGLISH_VARIANT_BY_COUNTRY, country) ? ENGLISH_VARIANT_BY_COUNTRY[country] : "en";
}

/** Afbrigði vistaðrar skýrslu: stimpillinn á enskri skýrslu, annars 'en' (óbreytt birting). */
export function englishVariantOf(
  report: { report_locale?: unknown; english_variant?: unknown } | null | undefined,
): EnglishVariant {
  return report?.report_locale === "en" && isEnglishVariant(report.english_variant) ? report.english_variant : "en";
}

/**
 * Dagsetning skýrslu eftir afbrigði, með sömu dagatalsreglum og formatReportDate:
 * 'en' → dd.mm.yyyy (óbreytt), en-US → m/d/yyyy, en-CA → yyyy-mm-dd, önnur → d/m/yyyy
 * (án núlla fremst, eins og NZS 4306). Ógild gildi birtast eins og formatReportDate skilar þeim.
 */
export function formatReportDateFor(value: string | null | undefined, variant: EnglishVariant): string {
  const text = formatReportDate(value);
  if (variant === "en") return text;
  const dmy = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(text);
  if (!dmy) return text;
  const [day, month, year] = [Number(dmy[1]), Number(dmy[2]), dmy[3]];
  if (variant === "en-US") return `${month}/${day}/${year}`;
  if (variant === "en-CA") return `${year}-${dmy[2]}-${dmy[1]}`;
  return `${day}/${month}/${year}`;
}

const SQ_FT_PER_SQ_M = 10.763910416709722;

/**
 * Stærð í eignatöflu: „<gildi> m²“ eins og áður; en-US bætir við „ (<ft²> ft²)“ þegar gildið er
 * tala. Gildinu sjálfu er aldrei breytt (enginn umreikningur á texta notanda).
 */
export function formatAreaFor(value: unknown, variant: EnglishVariant): string {
  const base = `${value} m²`;
  if (variant !== "en-US") return base;
  const m2 = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value.trim()) : NaN;
  if (!Number.isFinite(m2) || m2 <= 0) return base;
  return `${base} (${Math.round(m2 * SQ_FT_PER_SQ_M).toLocaleString("en-US")} ft²)`;
}
