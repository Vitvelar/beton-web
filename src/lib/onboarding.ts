import type { Brand } from "@/lib/brand";
import type { DashboardAccess } from "@/lib/access";

// Nýskráning fyrirtækis á app.rondva.com (APP-13). Hreinar reglur — engin
// next/*-innflutningur, svo proxy.ts, síðan, server action og
// scripts/verify-company-onboarding.cjs nota allar sama kóðann.
//
// Gagnagrunnurinn ræður: public.register_company(p_name, p_country) býr til
// fyrirtæki (pending, eða active ef company_signup_policy.auto_approve og
// erlent), owner-aðild og inspectors-röð. Hér er aðeins sama inntaksregla og
// fallið beitir (2–120 stafir, ISO-land) svo notandinn fái skýr villuboð.
//
// Sama regla er í beton-app lib/auth/register-company.ts — breyta báðum.
//
// admin.beton.is fær ALDREI nýskráningu: onboardingFor() skilar null fyrir
// allt nema "rondva", og óþekktir hýslar (preview, localhost) eru "beton".

export const ONBOARDING_PATH = "/dashboard/onboarding";

export const COMPANY_NAME_MIN = 2;
export const COMPANY_NAME_MAX = 120;
export const WEBSITE_MAX = 200;

/**
 * Lykill vefsíðu fyrirtækis í user_metadata. register_company() tekur ekki við
 * vefsíðu og enginn dálkur er til fyrir hana, svo hún er geymd hjá notandanum
 * (aðeins til upplýsinga við yfirferð eiganda — aðgangur byggir aldrei á þessu).
 */
export const COMPANY_WEBSITE_KEY = "company_website";

/** ISO 3166-1 alpha-2 (249 úthlutaðir kóðar). register_company krefst ^[A-Z]{2}$. */
export const COUNTRY_CODES: readonly string[] = (
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW " +
  "BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI " +
  "FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN " +
  "IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME " +
  "MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF " +
  "PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV " +
  "SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE " +
  "YT ZA ZM ZW"
).split(" ");

const COUNTRY_SET = new Set(COUNTRY_CODES);

export function isCountryCode(value: unknown): value is string {
  return typeof value === "string" && COUNTRY_SET.has(value);
}

export type OnboardingView = "register" | "pending";

/**
 * Hvaða nýskráningarskjá innskráður notandi án aðgangs á að sjá — eða null
 * (þá gildir innskráningarsíðan með villu, eins og áður). Aðeins Rondva.
 */
export function onboardingFor(brand: Brand, access: DashboardAccess): OnboardingView | null {
  if (brand !== "rondva" || access.allowed) return null;
  if (access.reason === "pending") return "pending";
  if (access.reason === "no_account" && access.canRegister === true) return "register";
  return null;
}

/** Klippir og fækkar bilum (líka línuskiptum) í eitt. */
export function normalizeCompanyName(raw: unknown): string {
  return typeof raw === "string" ? raw.replace(/\s+/g, " ").trim() : "";
}

/**
 * Valfrjáls vefsíða: tómt → null; annars http(s)-slóð með léni (punktur í
 * hýsilnafni), án notandanafns/lykilorðs og ekki IP-tala. „example.com" fær https://.
 * Skilar `undefined` ef ógilt.
 */
export function normalizeWebsite(raw: unknown): string | null | undefined {
  const input = typeof raw === "string" ? raw.trim() : "";
  if (!input) return null;
  if (input.length > WEBSITE_MAX || /\s/.test(input)) return undefined;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(input) ? input : `https://${input}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return undefined;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return undefined;
  if (url.username || url.password) return undefined;
  const host = url.hostname;
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(host) || /^[\d.]+$/.test(host)) return undefined;
  const href = url.pathname === "/" && !url.search && !url.hash ? url.origin : url.href;
  return href.length <= WEBSITE_MAX ? href : undefined;
}

export type CompanyField = "name" | "country" | "website";
export type CompanyFieldError = "required" | "length" | "invalid";

export interface CompanyInput {
  name: string;
  country: string;
  website: string | null;
}

export type CompanyValidation =
  | { ok: true; value: CompanyInput }
  | { ok: false; errors: Partial<Record<CompanyField, CompanyFieldError>> };

export function validateCompanyForm(raw: { name: unknown; country: unknown; website: unknown }): CompanyValidation {
  const errors: Partial<Record<CompanyField, CompanyFieldError>> = {};
  const name = normalizeCompanyName(raw.name);
  if (!name) errors.name = "required";
  else if (name.length < COMPANY_NAME_MIN || name.length > COMPANY_NAME_MAX) errors.name = "length";

  const country = typeof raw.country === "string" ? raw.country.trim().toUpperCase() : "";
  if (!country) errors.country = "required";
  else if (!isCountryCode(country)) errors.country = "invalid";

  const website = normalizeWebsite(raw.website);
  if (website === undefined) errors.website = "invalid";

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { name, country, website: website ?? null } };
}

export type RegisterOutcome =
  | "ok"
  | "already_registered"
  | "invalid_company_name"
  | "invalid_country"
  | "not_authenticated"
  | "failed";

/**
 * Niðurstaða register_company-kallsins út frá PostgREST-villunni. Fallið kastar
 * `raise exception '<kóði>'`, svo kóðinn er í `message`. Allt annað = "failed".
 */
export function registerOutcome(error: { message?: string | null; code?: string | null } | null | undefined): RegisterOutcome {
  if (!error) return "ok";
  const message = (error.message ?? "").trim();
  switch (message) {
    case "already_registered":
    case "invalid_company_name":
    case "invalid_country":
    case "not_authenticated":
      return message;
    default:
      return "failed";
  }
}

/**
 * Sjálfgefið land úr Accept-Language vafrans: fyrsta tungumálamerki (eftir q)
 * með tveggja stafa svæði sem er ISO-land. „en-GB,en;q=0.9" → "GB"; „en" → null.
 */
export function countryFromAcceptLanguage(header: string | null | undefined): string | null {
  if (!header) return null;
  const tags = header
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      const weight = q ? Number(q.slice(2)) : 1;
      return { tag: tag.trim(), weight: Number.isFinite(weight) ? weight : 0, index };
    })
    .filter((t) => t.tag && t.weight > 0)
    .sort((a, b) => b.weight - a.weight || a.index - b.index);
  for (const { tag } of tags) {
    const region = tag
      .split(/[-_]/)
      .slice(1)
      .find((sub) => /^[A-Za-z]{2}$/.test(sub));
    const code = region?.toUpperCase();
    if (code && isCountryCode(code)) return code;
  }
  return null;
}

export interface CountryOption {
  code: string;
  name: string;
}

/** Löndin með heiti á tungumáli stjórnborðsins, raðað eftir heiti (Intl í Node). */
export function countryOptions(locale: string): CountryOption[] {
  let names: Intl.DisplayNames | null = null;
  try {
    names = new Intl.DisplayNames([locale, "en"], { type: "region" });
  } catch {
    names = null;
  }
  const collator = new Intl.Collator(locale);
  return COUNTRY_CODES.map((code) => ({ code, name: names?.of(code) ?? code })).sort((a, b) =>
    collator.compare(a.name, b.name)
  );
}
