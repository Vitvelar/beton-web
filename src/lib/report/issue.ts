// „Sign & issue“ (report-2 PR 2): skoðunarmaður gefur NZS 4306-skýrslu út undir eigin nafni.
//
// Hvar er útgáfan geymd: inni í snapshot-inu sjálfu, `inspections.ai_report_data.issue`. Engin
// ný dálka- eða gagnagrunnsbreyting (rökstuðningur í PR-lýsingu):
//   - Útgáfan á við NÁKVÆMLEGA þann texta sem var gefinn út. `content_sha256` er hash af öllu
//     snapshot-inu án `issue`; útgáfan telst aðeins gild ef hash-ið passar við snapshot-ið sem
//     verið er að rendra. Hvaða skrifari sem er (ritillinn, ný AI-keyrsla, handvirk SQL) sem
//     breytir efninu gerir skýrsluna sjálfkrafa að drögum aftur — ekkert þarf að „muna“ að hreinsa.
//   - Ný AI-keyrsla (edge generate-report) skrifar ai_report_data frá grunni → `issue` hverfur.
//   - Eigendavörn RLS á `inspections` (`own_inspections`) gildir óbreytt: aðeins skoðunarmaðurinn
//     sem á skoðunina getur skrifað hana; sérdálkar hefðu ekki bætt þar neinu við (policy er
//     `for all`, engin dálkavörn).
//   - Vefurinn má fara út á undan hvaða gagnagrunnsflutningi sem er; engin ný select-dálkur í
//     skýrslusíðunni sem gæti brotið ALLAR skýrslur (líka Beton) ef flutningurinn vantar.
//
// Þessi eining er hrein (engin next/*, engin Supabase) svo verify-report-issue.cjs geti prófað
// hana beint. Aðeins notuð af server-kóða (node:crypto).

import { createHash } from "node:crypto";
import { reportStandardOf } from "./settings";

export const ISSUE_VERSION = 1;

/** Útgáfa skýrslu eins og hún er geymd í ai_report_data.issue. */
export interface StoredReportIssue {
  version: number;
  /** Tímastimpill útgáfunnar (ISO, UTC) — til skráningar. */
  issued_at: string;
  /** Almanaksdagur útgáfunnar (yyyy-mm-dd) á tímabelti skoðunarmannsins — það sem prentast. */
  issued_on: string;
  /** IANA tímabelti sem issued_on var reiknað á (UTC ef tækið gaf ekkert gilt). */
  time_zone: string;
  issued_by: {
    name: string;
    qualifications: string | null;
    /** auth-notandi sem gaf út; aðeins til skráningar. */
    user_id: string | null;
  };
  /** sha256 af snapshot-inu án `issue` (sjá reportContentHash). */
  content_sha256: string;
}

/** Gild útgáfa eins og skýrslusniðið notar hana. */
export interface ReportIssue {
  /** yyyy-mm-dd, prentað d/m/yyyy af skýrslunni. */
  issuedOn: string;
  inspectorName: string;
  qualifications: string | null;
}

/** Stöðugur strengur: lyklar raðaðir, undefined sleppt — óháð lyklaröð jsonb. */
function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map((v) => canonical(v === undefined ? null : v)).join(",")}]`;
  const o = value as Record<string, unknown>;
  const keys = Object.keys(o)
    .filter((k) => o[k] !== undefined)
    .sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonical(o[k])}`).join(",")}}`;
}

/** Snapshot án útgáfunnar (það sem útgáfan nær yfir). */
export function withoutIssue<T extends Record<string, unknown>>(report: T): Omit<T, "issue"> {
  const { issue: _issue, ...rest } = report;
  void _issue;
  return rest;
}

/** Hash af öllu efni skýrslunnar (texti, mat, athugasemdir, NZS-hluti) án `issue`. */
export function reportContentHash(report: Record<string, unknown>): string {
  return createHash("sha256").update(canonical(withoutIssue(report))).digest("hex");
}

/**
 * Gerir þessi skýrsla kost á „Sign & issue“? Aðeins NZS 4306-sniðið (report_standard = nzs_4306).
 * Venjulega sniðið (Beton, vitvelar-is, ensk afbrigði) fær hvorki vatnsmerki né útgáfuflæði.
 * Auk þess neitar server-aðgerðin á öðrum hýsli en app.rondva.com og fyrir Beton-fyrirtækið.
 */
export function isIssuable(report: { report_standard?: unknown } | null | undefined): boolean {
  return Boolean(report) && reportStandardOf(report) === "nzs_4306";
}

function isCivilDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function cleanText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * Útgáfa skýrslunnar ef hún er til OG gild fyrir þetta efni; annars null (= drög).
 * Gild = rétt gerð, nafn skráð og content_sha256 passar við snapshot-ið núna.
 */
export function issueOf(report: Record<string, unknown> | null | undefined): ReportIssue | null {
  if (!report || !isIssuable(report as { report_standard?: unknown })) return null;
  const raw = report.issue as Partial<StoredReportIssue> | null | undefined;
  if (!raw || typeof raw !== "object") return null;
  const name = cleanText(raw.issued_by?.name);
  if (!name || !isCivilDate(raw.issued_on) || typeof raw.content_sha256 !== "string") return null;
  if (raw.content_sha256 !== reportContentHash(report)) return null;
  return { issuedOn: raw.issued_on, inspectorName: name, qualifications: cleanText(raw.issued_by?.qualifications) };
}

/** Er útgáfa skráð en ógild (efni breytt eftir útgáfu)? Notað til að útskýra fyrir notanda. */
export function hasStaleIssue(report: Record<string, unknown> | null | undefined): boolean {
  return Boolean(report && typeof report.issue === "object" && report.issue !== null && issueOf(report) === null);
}

/** Almanaksdagur (yyyy-mm-dd) augnabliksins á gefnu IANA tímabelti; óþekkt belti → UTC. */
export function civilDateInZone(at: Date, timeZone: string | null | undefined): { date: string; timeZone: string } {
  const zone = typeof timeZone === "string" && timeZone.length <= 64 ? timeZone : "UTC";
  for (const tz of [zone, "UTC"]) {
    try {
      const parts = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(at);
      const get = (type: string) => parts.find((p) => p.type === type)?.value;
      const date = `${get("year")}-${get("month")}-${get("day")}`;
      if (isCivilDate(date)) return { date, timeZone: tz };
    } catch {
      // óþekkt belti → næsta tilraun (UTC)
    }
  }
  return { date: at.toISOString().slice(0, 10), timeZone: "UTC" };
}

export type IssueRefusal =
  | "not_issuable" // ekki NZS 4306 / íslensk skýrsla
  | "no_name" // hvorki nafn í skoðun né prófíl
  | "already_issued";

/**
 * Nafnið sem skýrslan er gefin út undir: sama regla og skýrslusíðan (property_data.inspectorName
 * hefur forgang, svo inspectors.full_name) — en EKKI sjálfgefna nafnið (Bragi), því útgáfa undir
 * röngu nafni er verri en engin útgáfa.
 */
export function issuerNameOf(report: { inspection?: { property_data?: Record<string, unknown> } } | null | undefined, profileName: string | null | undefined): string | null {
  const fromInspection = report?.inspection?.property_data?.inspectorName;
  return cleanText(fromInspection) ?? cleanText(profileName);
}

/**
 * Býr til útgáfufærsluna fyrir snapshot-ið. Hreint fall; kallarinn skrifar `{ ...snapshot, issue }`.
 * Skilar refusal ef útgáfa er ekki leyfð.
 */
export function buildIssue(args: {
  report: Record<string, unknown>;
  profileName: string | null | undefined;
  qualifications: string | null | undefined;
  userId: string | null;
  now: Date;
  timeZone?: string | null;
}): { issue: StoredReportIssue } | { refusal: IssueRefusal } {
  const { report, now } = args;
  if (!isIssuable(report as { report_standard?: unknown })) return { refusal: "not_issuable" };
  if (issueOf(report)) return { refusal: "already_issued" };
  const name = issuerNameOf(report as { inspection?: { property_data?: Record<string, unknown> } }, args.profileName);
  if (!name) return { refusal: "no_name" };
  const { date, timeZone } = civilDateInZone(now, args.timeZone);
  return {
    issue: {
      version: ISSUE_VERSION,
      issued_at: now.toISOString(),
      issued_on: date,
      time_zone: timeZone,
      issued_by: { name, qualifications: cleanText(args.qualifications), user_id: args.userId },
      content_sha256: reportContentHash(report),
    },
  };
}
