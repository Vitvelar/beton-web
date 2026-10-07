// NZS 4306:2005 — gögn skýrslunnar (samningur: plan/rondva/NZ-SKYRSLUSNID-HONNUN.md).
//   inspections.property_data.nzs4306  = inntak skoðunarmanns (Nzs4306Conditions)
//   inspections.ai_report_data.nzs4306 = úttak edge-fallsins (Nzs4306ReportData), aðeins
//                                        þegar report_standard = "nzs_4306"
// Hrein föll — engin next/* eða Supabase-innflutningur — svo prófin geti hlaðið þau.

export const NZ_AREA_KEYS = [
  "site",
  "subfloor",
  "exterior",
  "roof_exterior",
  "roof_space",
  "interior",
  "services",
  "accessory",
] as const;
export type NzAreaKey = (typeof NZ_AREA_KEYS)[number];
export type NzAreaValue = "yes" | "no" | "limited" | "na";

/** Röð og heiti svæða í Certificate of Inspection (viðauki C-snið). */
export const NZ_AREA_LABELS: Readonly<Record<NzAreaKey, string>> = {
  site: "Site",
  subfloor: "Subfloor",
  exterior: "Exterior",
  roof_exterior: "Roof exterior",
  roof_space: "Roof space",
  interior: "Interior",
  services: "Services",
  accessory: "Accessory units, ancillary spaces and buildings",
};

export const NZ_AREA_VALUE_LABELS: Readonly<Record<NzAreaValue, string>> = {
  yes: "Yes",
  no: "No",
  limited: "Limited",
  na: "N/A",
};

export interface Nzs4306Conditions {
  occupancy?: string;
  furnished?: string;
  weather?: string;
  areas?: Partial<Record<string, string>>;
  limitations?: string;
  meter?: string;
}

export interface Nzs4306MoistureReading {
  source_id: string;
  location: string;
  reading: string;
  unit: string;
  assessment: string;
}

export interface Nzs4306ReportData {
  significant_defects_summary?: string;
  maintenance_summary?: string;
  moisture_readings?: Nzs4306MoistureReading[];
  conditions?: Nzs4306Conditions;
  disclosure?: { inspector?: string; company?: string; model?: string; generated_at?: string };
}

const OCCUPANCY: Readonly<Record<string, string>> = { occupied: "Occupied", vacant: "Vacant", unknown: "Unknown" };
const FURNISHED: Readonly<Record<string, string>> = {
  furnished: "Furnished",
  partly: "Partly furnished",
  unfurnished: "Unfurnished",
};

export function occupancyLabel(value: unknown): string {
  return typeof value === "string" && value.trim() ? (OCCUPANCY[value.trim()] ?? value.trim()) : "";
}

export function furnishedLabel(value: unknown): string {
  return typeof value === "string" && value.trim() ? (FURNISHED[value.trim()] ?? value.trim()) : "";
}

/** Gildi svæðis í vottorðinu; vantar/óþekkt = "" (birtist sem „Not recorded“). */
export function areaValue(conditions: Nzs4306Conditions | null | undefined, key: NzAreaKey): NzAreaValue | "" {
  const raw = conditions?.areas?.[key];
  const value = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  return value === "yes" || value === "no" || value === "limited" || value === "na" ? value : "";
}

/**
 * Skilyrði skoðunar: afrit edge-fallsins (ai_report_data.nzs4306.conditions) hefur forgang,
 * annars inntak skoðunarmanns í skyndimynd skoðunarinnar (inspection.property_data.nzs4306).
 */
export function nzConditionsOf(
  nzs: Nzs4306ReportData | null | undefined,
  propertyData: Record<string, unknown> | null | undefined,
): Nzs4306Conditions {
  const fromReport = nzs?.conditions;
  if (fromReport && typeof fromReport === "object") return fromReport;
  const fromInspection = propertyData?.nzs4306;
  return fromInspection && typeof fromInspection === "object" ? (fromInspection as Nzs4306Conditions) : {};
}

/** Mælilínur sem birtast: aðeins línur með tölu (þjónninn hefur þegar sannprófað þær). */
export function moistureRowsOf(nzs: Nzs4306ReportData | null | undefined): Nzs4306MoistureReading[] {
  const rows = Array.isArray(nzs?.moisture_readings) ? nzs!.moisture_readings! : [];
  return rows.filter((row) => row && typeof row.reading === "string" && row.reading.trim() !== "").slice(0, 50);
}

/** Byggingarár sem tala, ef það er skráð (asbest-athugasemd fyrir hús byggð fyrir 2000). */
export function yearBuiltOf(propertyData: Record<string, unknown> | null | undefined): number | null {
  const raw = propertyData?.byggingarar;
  const year = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw.trim()) : NaN;
  return Number.isInteger(year) && year > 1800 && year < 2200 ? year : null;
}

/** Handvirk breyting á NZS 4306-hlutanum í ritlinum (updateReportText). */
export interface Nzs4306Edit {
  significant_defects_summary?: string;
  maintenance_summary?: string;
  /** Takmarkanir skoðunarmanns (conditions.limitations), orðrétt eins og hann skrifar þær. */
  limitations?: string;
  /** Vísar (í vistuðu skyndimyndinni) þeirra mælilína sem halda sér. Aðeins má EYÐA
   *  línum — aldrei bæta við eða breyta — svo engin mæling komi annars staðar frá en
   *  úr athugasemdum skoðunarmannsins (sannprófuð á þjóni). */
  keep_moisture_rows?: number[];
}

/**
 * Beitir ritilbreytingu á ai_report_data.nzs4306. `fallbackConditions` = inntak
 * skoðunarmanns (inspection.property_data.nzs4306) ef skyndimyndin hefur engin conditions,
 * svo breyting á takmörkunum týni ekki svæðum vottorðsins.
 */
export function applyNzs4306Edit(
  current: Nzs4306ReportData,
  edit: Nzs4306Edit,
  fallbackConditions?: Nzs4306Conditions | null,
): Nzs4306ReportData {
  const next: Nzs4306ReportData = { ...current };
  if (typeof edit.significant_defects_summary === "string") next.significant_defects_summary = edit.significant_defects_summary;
  if (typeof edit.maintenance_summary === "string") next.maintenance_summary = edit.maintenance_summary;
  if (typeof edit.limitations === "string") {
    const base = current.conditions && typeof current.conditions === "object" ? current.conditions : (fallbackConditions ?? {});
    next.conditions = { ...base, limitations: edit.limitations };
  }
  if (Array.isArray(edit.keep_moisture_rows) && Array.isArray(current.moisture_readings)) {
    const keep = new Set(edit.keep_moisture_rows.filter((i) => Number.isInteger(i)));
    next.moisture_readings = current.moisture_readings.filter((_, i) => keep.has(i));
  }
  return next;
}
