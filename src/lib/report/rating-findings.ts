// Einkunnir án athugasemdar sem niðurstöður skýrslunnar (Rondva, ensk skýrsla) — hrein eining.
//
// Vandinn (skoðun a4862d97, 2026-10-26): í appinu opnar einkunn Minor/Serious/Very serious á matsþætti
// gátlistans flýtiblað fyrir athugasemd; „Skip“ skilur aðeins einkunnina eftir. Samantektarkassarnir töldu
// aðeins athugasemdir („3 Minor, 0 Serious, 0 Very serious“) en AI sá einkunnirnar í samhenginu og skrifaði
// „a Very serious finding relating to cracks“ — lesandinn sá mótsögn.
//
// Lagfæringin: í skýrslu sem edge-fallið stimplaði `findings_basis: "observations_and_ratings"` (aðeins enskar
// skýrslur, beton-app generate-report/findings-basis.ts) verður hver einkunn sem er ekki í lagi og engin athugasemd
// í sama rými fjallar um að niðurstöðu í rýminu (merkt sem einkunn, án lýsingar eða tillögu frá AI). Allar tölur,
// töflur og listar sniðanna (sjálfgefið, NZS 4306, isop) telja hana þá með, eins og AI-textinn gerir.
//
// Ekkert breytist án stimpils: Beton/íslenskar skýrslur og allar eldri skýrslur birtast bæti fyrir bæti eins og
// áður (scripts/verify-report-identity.cjs), svo endurbirting gefinnar skýrslu breytir aldrei tölum hennar.

import { REPORT_COPY } from "./i18n";
import { isopRatingKeyLabel } from "./isop";
import { NZ_RATING_LABELS } from "./nz-elements";

export const FINDINGS_BASIS = "observations_and_ratings";

/** Forskeyti auðkennis tilbúinnar niðurstöðu (ekki uuid, svo hún rekst aldrei á athugasemd eða mynd). */
export const RATING_FINDING_ID_PREFIX = "rating:";

/** Texti niðurstöðu sem er aðeins einkunn (enskar skýrslur; AI skrifaði enga lýsingu fyrir hana). */
export const RATING_FINDING_NOTE = "Rated by the inspector on the checklist for this area. No further details were recorded.";

type FindingSeverity = "athugasemd" | "alvarleg" | "mjog_alvarleg";

/** Sama vörpun og appið notar þegar einkunn opnar flýtiblaðið (app/inspection/[id]/room/[roomId].tsx). */
const RATING_TO_SEVERITY: Readonly<Record<string, FindingSeverity>> = {
  warn: "athugasemd",
  danger: "alvarleg",
  mjog_alvarleg: "mjog_alvarleg",
};

interface ObservationLike {
  id: string;
  title?: string | null;
  category?: string | null;
  severity?: string | null;
}

interface RoomLike {
  slug: string;
  ratings?: Record<string, string> | null;
  observations?: ObservationLike[] | null;
}

/** Telur skýrslan einkunnir án athugasemdar með? Aðeins stimpluð ensk skýrsla. */
export function countsRatingFindings(report: { findings_basis?: unknown; report_locale?: unknown } | null | undefined): boolean {
  return report?.findings_basis === FINDINGS_BASIS && report?.report_locale === "en";
}

export function isRatingFindingId(id: string): boolean {
  return id.startsWith(RATING_FINDING_ID_PREFIX);
}

/** Orð í lágstöfum án kommu/broddstafa (íslensk heiti „Lóð“, „Hurðir“ → „lod“, „hurdir“ = lyklarnir). */
function words(value: string | null | undefined): string[] {
  return (value ?? "")
    .toLowerCase()
    .replace(/ð/g, "d")
    .replace(/þ/g, "th")
    .replace(/æ/g, "ae")
    .replace(/[öø]/g, "o")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function startsWithWords(text: string[], prefix: string[]): boolean {
  return prefix.length > 0 && prefix.length <= text.length && prefix.every((w, i) => text[i] === w);
}

/** Öll heiti matsþáttarins sem titill athugasemdar gæti byrjað á (lykill, ensk/NZ/isop-heiti). */
function candidateNames(key: string, displayLabel: string): string[][] {
  const names = [
    displayLabel,
    key,
    REPORT_COPY.en.ratingCategories[key],
    NZ_RATING_LABELS[key],
    isopRatingKeyLabel(key),
  ];
  const out: string[][] = [];
  for (const name of names) {
    const w = words(name);
    if (w.length > 0 && !out.some((o) => o.join(" ") === w.join(" "))) out.push(w);
  }
  return out;
}

/**
 * Fjallar athugasemd í rýminu um matsþáttinn? Flýtiblaðið býr til titilinn „<heiti> — <alvarleiki>“
 * (app lib/i18n/titles.ts), svo athugasemd telst fjalla um þáttinn ef titill hennar byrjar á heiti hans (heilum
 * orðum) eða flokkur hennar er sama heiti. Alvarleiki skiptir ekki máli: breyti skoðunarmaður alvarleika
 * athugasemdarinnar gildir hún, og einkunnin er ekki talin aftur.
 */
function covers(obs: ObservationLike, names: string[][]): boolean {
  const title = words(obs.title);
  const category = words(obs.category).join(" ");
  return names.some((n) => startsWithWords(title, n) || (category !== "" && category === n.join(" ")));
}

export interface RatingFinding {
  id: string;
  key: string;
  rating: string;
  severity: FindingSeverity;
  title: string;
}

/**
 * Einkunnir rýmis sem eru ekki í lagi og engin athugasemd rýmisins fjallar um, í röð einkunnanna.
 *
 * 1. Athugasemd sem fjallar um matsþáttinn (titill/flokkur, sjá covers) þekur einkunnina, hver sem alvarleikinn er.
 * 2. Athugasemd rýmisins sem þekur enga einkunn en hefur SAMA alvarleika og óþakin einkunn er talin skrif þeirrar
 *    einkunnar (skoðunarmaður breytti titlinum, t.d. „Leaning piles …“ fyrir Piles = Significant defect); ein
 *    athugasemd þekur eina einkunn, í röð. Þannig telst sami galli aldrei tvisvar.
 * Það sem eftir stendur eru einkunnir án athugasemdar („Skip“ á flýtiblaðinu).
 */
export function ratingFindingsOf(room: RoomLike, displayLabel: (key: string) => string): RatingFinding[] {
  const observations = (room.observations ?? []).filter((o) => !isRatingFindingId(o.id));
  const pending: RatingFinding[] = [];
  const used = new Set<ObservationLike>();
  for (const [key, rating] of Object.entries(room.ratings ?? {})) {
    const severity = typeof rating === "string" ? RATING_TO_SEVERITY[rating] : undefined;
    if (!severity) continue;
    const label = displayLabel(key);
    const names = candidateNames(key, label);
    const match = observations.filter((o) => covers(o, names));
    if (match.length > 0) {
      for (const o of match) used.add(o);
      continue;
    }
    const title = label.charAt(0).toUpperCase() + label.slice(1);
    pending.push({ id: `${RATING_FINDING_ID_PREFIX}${room.slug}:${key}`, key, rating, severity, title });
  }
  const spare = observations.filter((o) => !used.has(o));
  const out: RatingFinding[] = [];
  for (const finding of pending) {
    const i = spare.findIndex((o) => o.severity === finding.severity);
    if (i >= 0) {
      spare.splice(i, 1);
      continue;
    }
    out.push(finding);
  }
  return out;
}

/**
 * Skýrslan með einkunnum án athugasemdar sem niðurstöðum aftast í hverju rými. Óstimpluð skýrsla (Beton,
 * íslenska, eldri skýrslur) kemur til baka SAMI hluturinn óbreyttur.
 */
export function withRatingFindings<
  R extends {
    findings_basis?: unknown;
    report_locale?: unknown;
    rooms: Array<RoomLike & { observations: Array<ObservationLike & Record<string, unknown>> }>;
  },
>(report: R, displayLabel: (key: string) => string): R {
  if (!countsRatingFindings(report)) return report;
  return {
    ...report,
    rooms: report.rooms.map((room) => {
      const extra = ratingFindingsOf(room, displayLabel);
      if (extra.length === 0) return room;
      return {
        ...room,
        observations: [
          ...room.observations,
          ...extra.map((f) => ({
            id: f.id,
            number: null,
            category: "",
            title: f.title,
            description: RATING_FINDING_NOTE,
            suggestion: "",
            severity: f.severity,
          })),
        ],
      };
    }),
  } as R;
}
