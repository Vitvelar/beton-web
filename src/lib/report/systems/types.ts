// Sameiginleg „kerfi + status“-eining (isop og, síðar, AU as_4349_1).
// Samningur: plan/rondva/ISOP-SNID-HONNUN.md §3.1–3.3. Þessi mappa á að vera BÆTI FYRIR BÆTI eins og
// beton-web src/lib/report/systems/ (jafngildispróf: scripts/verify-isop-systems.cjs). Hrein gerðaskrá:
// engar innflutningar, engin ósjálfstæði á appinu, vefnum eða Deno.

/** Status kerfis. `limited` er leyft aðeins í sniðum sem skrá það í allowedStatuses (AU síðar; isop notar það ekki). */
export type SystemStatus = 'inspected' | 'limited' | 'not_inspected' | 'not_present';

export const SYSTEM_STATUSES: readonly SystemStatus[] = ['inspected', 'limited', 'not_inspected', 'not_present'];

/** Birtingarheiti status (ensk, sameiginleg öllum sniðum). */
export const SYSTEM_STATUS_LABELS: Readonly<Record<SystemStatus, string>> = {
  inspected: 'Inspected',
  limited: 'Limited',
  not_inspected: 'Not inspected',
  not_present: 'Not present',
};

/** Geymd gildi alvarleika (DB-skorða á observations.severity, óbreytt). */
export type SystemSeverity = 'athugasemd' | 'alvarleg' | 'mjog_alvarleg';

/** Merki á athugasemd (observations.tags, hornrétt á alvarleika). */
export type SystemObservationTag = 'safety_hazard' | 'further_evaluation';

export const SYSTEM_OBSERVATION_TAGS: readonly SystemObservationTag[] = ['safety_hazard', 'further_evaluation'];

/** „Describe“-reitur kerfis (gildið er texti skoðunarmanns, prentast orðrétt). */
export interface SystemDescribeField {
  key: string;
  label: string;
  /** Tillöguflögur í appinu; aldrei sjálfgefið gildi. */
  suggestions: readonly string[];
}

export interface SystemDef {
  /** Stöðugur lykill (geymdur í property_data.systems.items). */
  key: string;
  /** Kaflaheiti skýrslunnar. */
  label: string;
  /** Röð kafla (1…n); varakerfið („Additional items“) er síðast. */
  order: number;
  /** Grunn-slug rýma sem tilheyra kerfinu (númeruð rými, t.d. „isop-bedroom-2“, teljast með). */
  roomBases: readonly string[];
  /** Matslyklar íhluta (rooms.ratings). */
  ratingKeys: readonly string[];
  describe: readonly SystemDescribeField[];
  /** Leyfð status-gildi; tómt = kerfið hefur engan status (varakerfið). */
  allowedStatuses: readonly SystemStatus[];
  /** Þarf skoðunarmaðurinn að svara status áður en skýrsla er búin til? */
  statusRequired: boolean;
}

export interface SystemCatalog {
  /** Heiti sniðs, t.d. „isop“. */
  id: string;
  /** Forskeyti rýma-slugs, t.d. „isop-“. */
  slugPrefix: string;
  /** Kerfi í kaflaröð. */
  systems: readonly SystemDef[];
  /** Kerfið sem rými utan skrárinnar lenda í („additional“). */
  fallbackKey: string;
}

/** Gögn eins kerfis (property_data.systems.items[<key>]). */
export interface SystemEntry {
  status?: SystemStatus;
  /** Skylda þegar status = not_inspected; prentast orðrétt. */
  reason?: string;
  limitations?: string;
  describe?: Record<string, string>;
}

/** property_data.systems */
export interface SystemsData {
  v: 1;
  items: Record<string, SystemEntry>;
  /** rooms.id → kerfislykill, fyrir sérsniðin rými. */
  room_map: Record<string, string>;
}

/** Lágmarkslögun athugasemdar sem föllin þurfa (app SQLite-röð og edge/vef-snapshot passa bæði). */
export interface SystemObservation {
  id: string;
  severity?: string | null;
  tags?: readonly string[] | null;
  number?: string | number | null;
  observation_number?: string | number | null;
  title?: string | null;
  category?: string | null;
  suggestion?: string | null;
  polished_suggestion?: string | null;
}

/** Lágmarkslögun rýmis. */
export interface SystemRoom<O extends SystemObservation = SystemObservation> {
  id?: string | null;
  slug?: string | null;
  name?: string | null;
  observations?: readonly O[] | null;
}

/** Flokkur í gallatöflu, í röðinni sem þeir raðast (Safety → Major → Repair). */
export type DeficiencyCategory = 'safety' | 'major' | 'repair';

export interface SystemCounts {
  observations: number;
  /** safety + major + repair (hver athugasemd talin einu sinni). */
  deficiencies: number;
  safety: number;
  major: number;
  repair: number;
  /** Athugasemdir (athugasemd) án safety-merkis. */
  maintenance: number;
  furtherEvaluation: number;
  observationIds: string[];
}

export type SystemIssueCode =
  | 'status_missing'
  | 'status_invalid'
  | 'reason_missing'
  | 'inconsistent_not_present'
  | 'inconsistent_not_inspected';

export interface SystemIssue {
  systemKey: string;
  systemLabel: string;
  code: SystemIssueCode;
  /** Enskur texti fyrir notanda (appið þýðir/kortleggur eftir code). */
  message: string;
  /** Fjöldi athugasemda sem stangast á (aðeins inconsistent_*). */
  observations?: number;
}

export interface DeficiencyRow {
  /** Röð í töflu, 1-byggð. */
  rank: number;
  observationId: string;
  /** Athugasemdanúmer (úr gögnum, annars röð í gefnu rýma-/athugasemdaröð, 1-byggð). */
  number: string;
  category: DeficiencyCategory;
  systemKey: string;
  systemLabel: string;
  systemOrder: number;
  roomId: string | null;
  roomName: string;
  title: string;
  observationCategory: string;
  /** polished_suggestion ?? suggestion; stytting í 2 setningar er birtingaratriði. */
  recommendation: string;
  furtherEvaluation: boolean;
}

export interface MaintenanceRow {
  observationId: string;
  number: string;
  systemKey: string;
  systemLabel: string;
  systemOrder: number;
  roomId: string | null;
  roomName: string;
  title: string;
  furtherEvaluation: boolean;
}

export interface DeficiencySummary {
  rows: DeficiencyRow[];
  maintenance: MaintenanceRow[];
  counts: { safety: number; major: number; repair: number; deficiencies: number; maintenance: number };
}

export interface SystemOverviewRow {
  key: string;
  label: string;
  order: number;
  /** null = ósvarað. */
  status: SystemStatus | null;
  reason: string;
  limitations: string;
  hasDeficiency: boolean;
  counts: SystemCounts;
  roomIds: string[];
  /** t.d. „Inspected · 2 deficiencies“. */
  statusText: string;
}
