// Árekstravörn fyrir handvirkar textabreytingar á ai_report_data: ritillinn fær
// hash af snapshot-inu við opnun og sendir hann með við vistun. Ef snapshot-ið
// hefur breyst á meðan (t.d. ný AI-skýrslugerð eða vistun úr öðrum flipa) passar
// hash-ið ekki og vistunin er stöðvuð í stað þess að yfirskrifa nýrri texta.
//
// Deterministic: jsonb skilar lyklum í stöðugri röð frá PostgREST, svo
// JSON.stringify á sóttu gildi er eins milli fetch-a. Hash-ið er ALLTAF reiknað
// af nýsóttu gildi (aldrei af objektinum sem við sendum inn) svo lyklaröð
// okkar megin skipti ekki máli.

import { createHash } from "node:crypto";

export function snapshotToken(aiReportData: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(aiReportData))
    .digest("hex")
    .slice(0, 32);
}
