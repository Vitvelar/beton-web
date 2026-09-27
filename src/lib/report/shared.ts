import { formatReportDate } from "./date";
import { reportCopy, type ReportLocale } from "./i18n";
// Shared helpers for the background report-PDF pipeline: worker-token auth, the
// Storage object path, and the human-facing download filename. Kept free of
// next/* imports so both route handlers and the worker tick can use them.

export const WORKER_TOKEN_HEADER = "x-report-worker-token";
export const REPORT_BUCKET = "inspection-reports";

// True when the request carries the internal worker token. Returns false if the
// token env is unset, so an un-configured deployment never trusts the header.
export function isWorkerRequest(headerValue: string | null | undefined): boolean {
  const expected = process.env.REPORT_WORKER_TOKEN;
  if (!expected) return false;
  return !!headerValue && headerValue === expected;
}

function asciiSafe(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

// Machine-safe Storage object path (ASCII, no spaces). Stable per inspection so
// a re-render upserts the same object.
//   {owner}/{inspectionId}/Astandsskodun_{safeAddress}_{date}.pdf
export function reportStoragePath(args: {
  ownerId: string | null;
  inspectionId: string;
  address: string | null;
  date: string | null;
}): string {
  const owner = args.ownerId ?? "shared";
  const safeAddress = asciiSafe(args.address ?? "skyrsla") || "skyrsla";
  const datePart = args.date ? `_${args.date}` : "";
  return `${owner}/${args.inspectionId}/Astandsskodun_${safeAddress}${datePart}.pdf`;
}

// Heiti skýrslu: "<heimilisfang> - <dd.mm.áááá>" (ósk eiganda 2026-09-27). Notað sem
// <title> skýrslusíðunnar (PDF-heiti í skoðara) með séríslenskum stöfum.
export function reportTitle(
  address: string | null,
  date: string | null,
  locale: ReportLocale = "is"
): string {
  const fallback = reportCopy(locale).downloadFallbackAddress;
  const addr = (address ?? "").trim() || fallback;
  return date ? `${addr} - ${formatReportDate(date)}` : addr;
}

// Íslenskir stafir sem hverfa ekki við NFD-sundurliðun.
const ASCII_LETTERS: Readonly<Record<string, string>> = {
  þ: "th", Þ: "Th", æ: "ae", Æ: "Ae", ð: "d", Ð: "D", ø: "o", Ø: "O", ß: "ss",
};

// Skráarheiti niðurhals: sama og heitið en aðeins ASCII ("Þórsgata 1 - 21.09.2026" →
// "Thorsgata 1 - 21.09.2026.pdf"). Supabase Storage setur `download`-heitið óafkóðað í
// Content-Disposition, svo séríslenskir stafir enduðu sem %C3%A9 í skráarheitinu.
export function reportDownloadName(
  address: string | null,
  date: string | null,
  locale: ReportLocale = "is"
): string {
  const ascii = reportTitle(address, date, locale)
    .replace(/[þÞæÆðÐøØß]/g, (c) => ASCII_LETTERS[c] ?? c)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 ._()-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return `${ascii || "report"}.pdf`;
}

// A report_url is a signable Storage object path only if it has no URI scheme.
// Legacy values can be null, a local file:// URI, or a full http(s) signed URL —
// none of which we re-sign.
export function isStorageObjectPath(reportUrl: string | null | undefined): reportUrl is string {
  return !!reportUrl && !/^[a-z][a-z0-9+.-]*:\/\//i.test(reportUrl);
}
