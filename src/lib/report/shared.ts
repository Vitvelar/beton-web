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

// Human-facing download name: "Beton Ástandsskoðun - <heimilisfang>, <dags>.pdf".
// Forced via the signed-URL `download` option / Content-Disposition; Icelandic
// characters are preserved there.
export function reportDownloadName(address: string | null, date: string | null): string {
  const addr = (address ?? "skýrsla").trim() || "skýrsla";
  const tail = date ? `, ${date}` : "";
  return `Beton Ástandsskoðun - ${addr}${tail}.pdf`;
}

// A report_url is a signable Storage object path only if it has no URI scheme.
// Legacy values can be null, a local file:// URI, or a full http(s) signed URL —
// none of which we re-sign.
export function isStorageObjectPath(reportUrl: string | null | undefined): reportUrl is string {
  return !!reportUrl && !/^[a-z][a-z0-9+.-]*:\/\//i.test(reportUrl);
}
