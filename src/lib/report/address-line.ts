import type { EnglishVariant } from "./english-variant";

// Staðsetningarlína „Eign“-töflu almennu skýrslunnar (Rondva, LANDAVAL §7). Hrein regla — engin
// next/*-innflutningur — svo report/page.tsx og scripts/verify-report-address.cjs nota sama kóðann.
//
// Landið kemur úr STIMPLUÐU enska afbrigðinu (ai_report_data.english_variant, sett við gerð skýrslunnar):
// vistuð skýrsla er aldrei endurtúlkuð eftir núverandi landi fyrirtækisins, og PDF-vinnslan (worker)
// hefur enga innskráningu sem hægt er að spyrja um fyrirtækið. Því:
//   en-US / en-CA             → „Town, ST 12345“ (fylki úr property_data.state ?? property_data.isop.state)
//   en-AU                     → „Town ST 1234“ (Australia Post, án kommu: „Ashgrove QLD 4060“)
//   án fylkis (US/CA/AU)      → „Town 12345“
//   en-GB / en-IE / en-NZ     → „Town Postcode“
//   bær sem endar þegar á fylkinu („Ashgrove QLD“) fær það ekki tvisvar
//   „en“ (annað land, eða skýrsla án stimpils), íslenska → null = EKKI snert: núverandi lína
//   („<póstnúmer> <sveitarfélag>“ undir „Póstnúmer/Postcode“) birtist bæti fyrir bæti eins og áður.
// Beton / Ísland / eldri skýrslur eru því alltaf óbreyttar.

const COMMA_REGION: ReadonlySet<EnglishVariant> = new Set(["en-US", "en-CA"]);
const AU_REGION: ReadonlySet<EnglishVariant> = new Set(["en-AU"]);
const TOWN_FIRST: ReadonlySet<EnglishVariant> = new Set(["en-GB", "en-IE", "en-NZ"]);

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : typeof value === "number" ? String(value) : "";
}

/** Fylki/hérað skoðunar: property_data.state (almenn snið), annars property_data.isop.state. */
export function regionOf(propertyData: unknown): string {
  if (!propertyData || typeof propertyData !== "object") return "";
  const pd = propertyData as { state?: unknown; isop?: unknown };
  const direct = clean(pd.state);
  if (direct) return direct;
  const isop = pd.isop && typeof pd.isop === "object" ? (pd.isop as { state?: unknown }) : null;
  return clean(isop?.state);
}

export interface LocalityInput {
  postal_code?: unknown;
  municipality?: unknown;
  property_data?: unknown;
}

/**
 * Staðsetningarlínan fyrir lönd með stimplað afbrigði, eða null þegar núverandi lína á að haldast
 * (íslenska, „en“ án lands, eldri skýrslur). Aldrei kastað; tómir hlutar falla út.
 */
export function reportLocality(
  inspection: LocalityInput,
  { locale, variant }: { locale: string; variant: EnglishVariant },
): string | null {
  if (locale !== "en") return null;
  const comma = COMMA_REGION.has(variant);
  const au = AU_REGION.has(variant);
  if (!comma && !au && !TOWN_FIRST.has(variant)) return null;
  const town = clean(inspection.municipality);
  const postcode = clean(inspection.postal_code);
  if (!comma && !au) return [town, postcode].filter(Boolean).join(" ");
  const region = regionOf(inspection.property_data);
  // Enginn reitur fyrir fylki, eða bærinn endar þegar á því („Ashgrove QLD“, „Denver, CO“): „Town Postcode“.
  if (!region || endsWithRegion(town, region)) return [town, postcode].filter(Boolean).join(" ");
  if (au) return [town, region, postcode].filter(Boolean).join(" ");
  return [town, [region, postcode].filter(Boolean).join(" ")].filter(Boolean).join(", ");
}

/** Bærinn endar á fylkiskóðanum sem sérstöku orði (óháð hástöfum): „Ashgrove QLD“, „Denver, CO“. */
function endsWithRegion(town: string, region: string): boolean {
  const escaped = region.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[\\s,])${escaped}$`, "i").test(town);
}
