// isop-skýrslusnið (report_standard = "isop"): gögn skýrslunnar og hrein hjálparföll.
// Samningur: plan/rondva/ISOP-SNID-HONNUN.md §3.2, §3.6, §5. Kerfa- og Deficiency-rökin eru EKKI hér heldur í
// src/lib/report/systems/ (sameiginleg eining, bæti-eins við beton-app); þessi skrá geymir aðeins það sem vefurinn
// bætir við: lögun ai_report_data.isop, birtingartexta (orðaval í eigin orðum, [YFIRLESTUR]) og stærð/ft².
// Hrein föll — engin next/* eða Supabase-innflutningur — svo prófin geti hlaðið þau.

import type { EnglishVariant } from "./english-variant";

/** Úttak edge-fallsins í ai_report_data.isop (aðeins þegar report_standard = "isop"). Allt valkvætt. */
export interface IsopReportData {
  deficiencies_summary?: string;
  maintenance_summary?: string;
  /** Orðrétt afrit af property_data.systems við gerð skýrslunnar. */
  systems?: unknown;
  /** Orðrétt afrit af property_data.isop við gerð skýrslunnar. */
  conditions?: IsopConditions;
  /** Merki athugasemda við gerð: { <obs id>: ["safety_hazard", …] }. */
  tags?: Record<string, string[]>;
  disclosure?: { inspector?: string; company?: string; model?: string; generated_at?: string };
}

/** Inntak skoðunarmanns: inspections.property_data.isop. */
export interface IsopConditions {
  state?: string;
  occupancy?: string;
  furnished?: string;
  size_sqft?: string;
  /** Almennar takmarkanir skoðunarmanns — prentast orðrétt, aldrei í gegnum AI. */
  limitations?: string;
  agreement_ref?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * Skilyrði skoðunar: afrit edge-fallsins (ai_report_data.isop.conditions) hefur forgang, annars inntak
 * skoðunarmanns í skyndimynd skoðunarinnar (inspection.property_data.isop). Aðeins strengir halda sér.
 */
export function isopConditionsOf(
  isop: IsopReportData | null | undefined,
  propertyData: Record<string, unknown> | null | undefined,
): IsopConditions {
  const raw = isRecord(isop?.conditions) ? isop?.conditions : isRecord(propertyData?.isop) ? propertyData?.isop : null;
  const out: IsopConditions = {};
  if (!raw) return out;
  for (const key of ["state", "occupancy", "furnished", "size_sqft", "limitations", "agreement_ref"] as const) {
    const value = (raw as Record<string, unknown>)[key];
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

/** Tags úr ai_report_data.isop.tags: aðeins listar af strengjum. */
export function isopTagsOf(isop: IsopReportData | null | undefined): Record<string, string[]> {
  const raw = isop?.tags;
  const out: Record<string, string[]> = {};
  if (!isRecord(raw)) return out;
  for (const [id, list] of Object.entries(raw)) {
    if (Array.isArray(list)) out[id] = list.filter((tag): tag is string => typeof tag === "string");
  }
  return out;
}

/** Afbrigði sem sniðið birtir: en-CA helst, annars en-US (sniðið er fyrir Bandaríkin og Kanada). */
export function isopVariantOf(variant: EnglishVariant): "en-US" | "en-CA" {
  return variant === "en-CA" ? "en-CA" : "en-US";
}

const SQ_FT_PER_SQ_M = 10.763910416709722;
const NUMBER_RE = /^\d[\d,]*(?:\.\d+)?$/;

function parseNumber(raw: unknown): number | null {
  const value = typeof raw === "number" ? raw : typeof raw === "string" && raw.trim() ? raw.trim() : "";
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? value : null;
  if (!value || !NUMBER_RE.test(value)) return null;
  const n = Number(value.replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Stærðarlína eignar. en-US: ft² fyrst („1,850 ft² (172 m²)“); en-CA: m² fyrst („172 m² (1,851 ft²)“).
 * Heimild: size_sqft (inntak skoðunarmanns í ft²), m² úr staerd_m2 ef til, annars umreiknað. Texti sem er ekki
 * tala („about 1,850“) prentast orðrétt og er ekki umreiknaður. Tómt ef ekkert er skráð.
 */
export function isopSizeLine(
  conditions: IsopConditions | null | undefined,
  propertyData: Record<string, unknown> | null | undefined,
  variant: "en-US" | "en-CA",
): string {
  const sqftRaw = text(conditions?.size_sqft).trim();
  const sqft = parseNumber(sqftRaw);
  const m2Stored = parseNumber(propertyData?.staerd_m2);
  const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
  if (sqftRaw && sqft === null) return sqftRaw; // texti skoðunarmanns, óbreyttur
  const feet = sqft ?? (m2Stored !== null ? m2Stored * SQ_FT_PER_SQ_M : null);
  const metres = m2Stored ?? (sqft !== null ? sqft / SQ_FT_PER_SQ_M : null);
  if (feet === null || metres === null) return "";
  return variant === "en-US" ? `${fmt(feet)} ft² (${fmt(metres)} m²)` : `${fmt(metres)} m² (${fmt(feet)} ft²)`;
}

/** Fyrstu `count` setningar texta (fyrir gallatöfluna); `cut` segir hvort eitthvað var skorið af. */
export function firstSentences(value: string, count: number): { text: string; cut: boolean } {
  const clean = value.trim().replace(/\s+/g, " ");
  if (!clean) return { text: "", cut: false };
  const sentences = clean.split(/(?<=[.!?])\s+(?=[A-Z0-9"“(])/);
  if (sentences.length <= count) return { text: clean, cut: false };
  return { text: sentences.slice(0, count).join(" "), cut: true };
}

// ───────────────────────── orðaval (isop_terms, aðeins birting; geymd gildi breytast aldrei)

/** Merki einkunnar íhlutar (rooms.ratings) í isop_terms. „na“ er sleppt við birtingu. [YFIRLESTUR] */
export const ISOP_RATING_VALUE_LABELS: Readonly<Record<string, string>> = {
  ok: "Inspected",
  warn: "Maintenance",
  danger: "Repair or replace",
  mjog_alvarleg: "Major defect",
};

const RATING_KEY_LABELS: Readonly<Record<string, string>> = {
  penetrations_skylights: "Penetrations & skylights",
  gutters_downspouts: "Gutters & downspouts",
  chimney_exterior: "Chimney (exterior)",
  trim_eaves_soffit_fascia: "Trim, eaves, soffit & fascia",
  exterior_doors: "Exterior doors",
  windows_exterior: "Windows (exterior)",
  walkways_driveway: "Walkways & driveway",
  steps_stairs_railings: "Steps, stairs & railings",
  decks_balconies_porches: "Decks, balconies & porches",
  grading_drainage: "Grading & drainage",
  basement_walls_floor: "Basement walls & floor",
  heating_equipment: "Heating equipment",
  cooling_equipment: "Cooling equipment",
  venting_flue: "Venting / flue",
  main_shutoff: "Main water shutoff",
  drain_waste_vent: "Drain, waste & vent",
  tpr_valve: "Temperature & pressure relief valve",
  fuel_shutoff: "Fuel shutoff",
  sump_pump: "Sump pump",
  fixtures_general: "Fixtures",
  gfci_afci: "GFCI / AFCI protection",
  outlets_switches: "Outlets & switches",
  smoke_co_alarms: "Smoke & CO alarms",
  gas_log_insert: "Gas log / insert",
  chimney_flue: "Chimney / flue",
  vapor_retarder: "Vapor retarder",
  exhaust_fans: "Exhaust fans",
  attic_access: "Attic access",
  stairs_railings: "Stairs & railings",
  cabinets_counters: "Cabinets & counters",
  garage_door_opener: "Garage door opener",
};

/** Heiti matslykils íhlutar: sérheiti ef til, annars lykillinn með bilum og hástaf fremst. */
export function isopRatingKeyLabel(key: string): string {
  if (Object.hasOwn(RATING_KEY_LABELS, key)) return RATING_KEY_LABELS[key];
  const words = key.replace(/_/g, " ").trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : key;
}

/** Hús byggt fyrir 1978 → athugasemd um blýmálningu (sama aðferð og asbest-athugasemd NZ/AU). [YFIRLESTUR, sbr. Kanada] */
export const ISOP_LEAD_PAINT_YEAR = 1978;

// ── Stillingasíða (W1): valkosturinn „Home inspection (US/Canada)“ og Texas-viðvörun ──────────────────────────

const ISOP_COUNTRIES = new Set(["US", "CA"]);

/** Einn fasti: sjálfgefið óvirkt. Aðeins `ISOP_ENABLED=1` (þjónn) kveikir á valkostinum. */
export function isopEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.ISOP_ENABLED === "1";
}

/** Valkosturinn sést aðeins fyrirtækjum í US/CA (aldrei Beton/IS) og aðeins þegar kveikt er á honum. */
export function isopOfferedTo(country: unknown, enabled: boolean = isopEnabled()): boolean {
  return enabled && typeof country === "string" && ISOP_COUNTRIES.has(country.trim().toUpperCase());
}

/**
 * Texas-viðvörun (hönnun §6.4): satt fyrir state 'TX', ZIP 733xx/75xxx–79xxx/885xx eða heimilisfang
 * sem endar á „, TX“/„Texas“. Aldrei læsing. Fyrirtæki hafa ekkert fylki í gagnagrunninum í dag,
 * svo stillingasíðan sendir null þar til slík uppspretta er til.
 */
export function texasNotice({ state, postalCode, address }: { state?: string | null; postalCode?: string | null; address?: string | null }): boolean {
  if ((state ?? "").trim().toUpperCase() === "TX") return true;
  const zip = (postalCode ?? "").trim().match(/^(\d{3})\d{2}(?:-\d{4})?$/);
  if (zip) {
    const prefix = Number(zip[1]);
    if (prefix === 733 || (prefix >= 750 && prefix <= 799) || prefix === 885) return true;
  }
  return /(,\s*(TX|Texas)\.?)\s*$/i.test((address ?? "").trim());
}
