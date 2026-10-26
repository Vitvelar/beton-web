import { isCountryCode } from "@/lib/onboarding";

// Land fyrirtækis breytt í stillingum (app.rondva.com, LANDAVAL §2). Hreinar reglur — engin next/*-innflutningur —
// svo server action, formið og scripts/verify-company-country.cjs nota sama kóðann.
//
// Gagnagrunnurinn ræður: public.set_company_country(p_country) (beton-app flutningur, keyrður sér með samþykki Hjalta)
// er aðeins fyrir eiganda, læsir Beton og hreinsar það sem var bundið gamla landinu. Hér er aðeins
// þýðing villukóða og sama „hvað hreinsast“-regla svo staðfestingin geti sagt notandanum það fyrirfram.

export type CountryChangeOutcome =
  | "ok"
  | "not_authenticated"
  | "invalid_country"
  | "not_owner"
  | "locked"
  | "not_allowed"
  | "unavailable"
  | "failed";

/**
 * Niðurstaða set_company_country-kallsins út frá PostgREST-villunni. Fallið kastar `raise exception '<kóði>'`, svo
 * kóðinn er í `message`. Fallið vantar í framleiðslu (flutningurinn ekki keyrður enn) → "unavailable" (PGRST202 /
 * 42883 eða texti um að fallið finnist ekki) — rólegt viðmót, ekki bilun.
 */
export function countryChangeOutcome(
  error: { message?: string | null; code?: string | null } | null | undefined,
): CountryChangeOutcome {
  if (!error) return "ok";
  const message = (error.message ?? "").trim();
  switch (message) {
    case "not_authenticated":
    case "invalid_country":
      return message;
    case "not_company_owner":
      return "not_owner";
    case "company_locked":
      return "locked";
    case "country_not_allowed":
      return "not_allowed";
  }
  const code = error.code ?? "";
  if (code === "PGRST202" || code === "42883" || /could not find the function|function .* does not exist/i.test(message)) {
    return "unavailable";
  }
  return "failed";
}

/** Gilt landskóðaval í stillingum: ISO-land eftir upper(trim()). */
export function normalizeCountryChoice(raw: unknown): string | null {
  const code = typeof raw === "string" ? raw.trim().toUpperCase() : "";
  return isCountryCode(code) ? code : null;
}

/**
 * Hvaða skýrslusnið hreinsast við landaskipti (sama regla og set_company_country): nzs_4306 er bundið við NZ,
 * isop við US/CA. Skráð snið `null` fylgir landinu sjálfu og er því ekki hér.
 */
export function standardClearedBy(reportStandard: string | null | undefined, newCountry: string): "nzs_4306" | "isop" | null {
  if (reportStandard === "nzs_4306" && newCountry !== "NZ") return "nzs_4306";
  if (reportStandard === "isop" && newCountry !== "US" && newCountry !== "CA") return "isop";
  return null;
}

/**
 * Land sem fyrirtæki má velja í stillingum: Ísland aðeins fyrir fyrirtæki sem er þegar á Íslandi (Beton/samstarfsaðilar;
 * set_company_country hafnar IS fyrir aðra með country_not_allowed). Núverandi land er alltaf í listanum.
 */
export function selectableCountries<T extends { code: string }>(options: readonly T[], current: string): T[] {
  return options.filter((option) => option.code !== "IS" || current === "IS");
}

/**
 * Nýtt land NZ án skráðs skýrslusniðs (companies.report_standard = null) gerir sniðið NZS 4306 sjálfkrafa
 * (resolveReportSettings) — staðfestingin segir það fyrirfram. Skráð snið (líka „default“) heldur sér.
 */
export function nzsBecomesDefault(newCountry: string, reportStandardSet: boolean): boolean {
  return newCountry === "NZ" && !reportStandardSet;
}
