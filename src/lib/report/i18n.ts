// Textar skýrslunnar sjálfrar (PDF + skýrslusíðan), einn hlutur á hvert tungumál.
//
// Tungumál skýrslunnar er EKKI viðmótsmál notandans: það er stimplað í
// ai_report_data.report_locale þegar skýrslan er gerð (edge-fallið
// generate-report / vefleiðin) og ræður hér. Eldri skýrslur hafa engan stimpil
// → íslenska, bæti fyrir bæti eins og áður.
//
// Íslenskir skilmálar (lagatexti Beton með nafni fyrirtækis) eru áfram JSX í
// report/page.tsx og birtast aðeins á íslensku. Á öðrum málum er aldrei
// lagatexti Beton: aðeins tengill á skilmála fyrirtækisins (company_terms_url),
// annars er hlutanum sleppt (ákvörðun eiganda 2026-09-26).
//
// Alvarleiki, einkunnir og flokkar fylgja beton-app lib/i18n/labels.ts.
// Texti með breytum er sniðmát með {nafni}, birtur með fill()/format()
// (src/lib/i18n/format.ts) svo íslenskan haldi sömu textahnútum og áður.

export const REPORT_LOCALES = ["is", "en"] as const;
export type ReportLocale = (typeof REPORT_LOCALES)[number];

export function isReportLocale(value: unknown): value is ReportLocale {
  return (REPORT_LOCALES as readonly unknown[]).includes(value);
}

/** Tungumál vistaðrar skýrslu; engin/óþekkt gildi = íslenska (eldri skýrslur). */
export function reportLocaleOf(report: { report_locale?: unknown } | null | undefined): ReportLocale {
  const value = report?.report_locale;
  return isReportLocale(value) ? value : "is";
}

type SeverityKey = "athugasemd" | "alvarleg" | "mjog_alvarleg";

const is = {
  /** <title> / skjalaheiti þegar skoðun finnst ekki. */
  docTitle: "Ástandsskoðun",
  /** Heiti skýrslu án heimilisfangs (sjá reportTitle í shared.ts). */
  downloadFallbackAddress: "Ástandsskoðun",

  coverTitle: "Ástandsskoðun",
  coverPhotoAlt: "Forsíðumynd",
  noCoverPhoto: "Engin forsíðumynd",
  customer: "Viðskiptavinur",
  inspectionDate: "Skoðunardagur",
  inspector: "Skoðunarmaður",

  toc: "Efnisyfirlit",
  tocIntro: "Inngangur og matskerfi",
  tocSummary: "Samantekt",
  tocRoom: "Rými — {name}",
  tocActionList: "Verkefnalisti",
  tocTerms: "Skilmálar og fyrirvarar",

  introHeading: "Ástandsskoðun {company}",
  introPurpose:
    "Markmið ástandsskoðunar er að veita verkkaupa upplýsingar um almennt og sýnilegt ástand fasteignar á þeim tímapunkti sem skoðun fer fram. Ástandsskoðun byggir á hlutlausri skoðun og stöðluðum verkferlum {company} og er ætluð til upplýsingaöflunar vegna fasteignaviðskipta eða mats á ástandi eigin eignar. Ástandsskoðun og skýrsla eiga eingöngu við um þá fasteign sem skoðuð er og taka einungis til þeirra atriða sem sérstaklega eru nefnd í skýrslu.",
  termsLinkBefore: "Allar ástandsskoðanir falla undir",
  termsLinkText: "skilmála {company}",

  ratingSystem: "Matskerfi",
  ratingSystemHow:
    "Svona virkar matskerfið: hver athugasemd í skýrslunni fær mat sem sýnir hversu alvarlegt tjónið er. Alvarleiki tjónsins er metinn út frá hversu miklar afleiðingar það getur haft fyrir byggingarhlutann/bygginguna ásamt því hversu mikilvægt er að laga það.",
  ratingSystemTypes: "Í skýrslunni er að finna þrjár mismunandi tegundir athugasemda.",
  severity: {
    athugasemd: {
      label: "Athugasemd",
      short: "Athugasemd",
      description: "Tjón sem hefur engin áhrif á virkni byggingarhlutans/byggingarinnar.",
    },
    alvarleg: {
      label: "Alvarleg athugasemd",
      short: "Alvarleg",
      description:
        "Tjón sem veldur því að virkni byggingarhlutans er í ólagi til lengri tíma litið. Slíkt tjón getur valdið skemmdum á öðrum byggingarhlutum.",
    },
    mjog_alvarleg: {
      label: "Mjög alvarleg athugasemd",
      short: "Mjög alvarleg",
      description:
        "Tjón sem þegar hefur valdið eða mun valda því að virkni byggingarhlutans verður í ólagi fljótlega. Slíkt tjón getur valdið skemmdum á öðrum byggingarhlutum eða hefur nú þegar gert það.",
    },
  } as Record<SeverityKey, { label: string; short: string; description: string }>,

  // Einkunnakerfi 1–3 (companies.rating_scheme = condition_1_3). Aðeins birting:
  // athugasemd → 1, alvarleg → 2, mjog_alvarleg → 3.
  conditionRatingSystemHow:
    "Svona virkar matskerfið: hver athugasemd í skýrslunni fær ástandseinkunn frá 1 til 3. Einkunnin sýnir hversu alvarlegur gallinn er og hversu brýnt er að bregðast við honum.",
  conditionRatingSystemTypes: "Í skýrslunni eru notaðar þrjár ástandseinkunnir.",
  conditionSeverity: {
    athugasemd: {
      label: "Ástandseinkunn 1",
      short: "Einkunn 1",
      description: "Ekki þörf á viðgerð nú. Eðlilegt viðhald.",
    },
    alvarleg: {
      label: "Ástandseinkunn 2",
      short: "Einkunn 2",
      description: "Galli sem þarf að gera við eða endurnýja, en er hvorki alvarlegur né brýnn.",
    },
    mjog_alvarleg: {
      label: "Ástandseinkunn 3",
      short: "Einkunn 3",
      description: "Alvarlegur galli, eða galli sem þarf að gera við, endurnýja eða rannsaka án tafar.",
    },
  } as Record<SeverityKey, { label: string; short: string; description: string }>,
  conditionRating: {
    ok: "Viðunandi",
    warn: "Einkunn 1",
    danger: "Einkunn 2",
    mjog_alvarleg: "Einkunn 3",
  } as Record<string, string>,

  summary: "Samantekt",
  introduction: "Inngangur",
  propertyDescription: "Eignalýsing",
  conclusion: "Niðurstaða",
  property: "Eign",
  address: "Heimilisfang",
  postcode: "Póstnúmer",
  propertyId: "Fastanúmer",
  propertyType: "Tegund",
  size: "Stærð",
  yearBuilt: "Byggingarár",
  buildStage: "Byggingarstig",
  inspection: "Skoðun",
  attendees: "Viðstaddir",
  weather: "Veður",
  roomCount: "Fjöldi rýma",
  observationCount: "Fjöldi athugasemda",
  photoCount: "Fjöldi mynda",

  roomNotes: "Athugasemdir um rýmið:",
  suggestion: "Tillaga:",
  noObservations: "Engar athugasemdir í þessu rými.",
  /** Einkunn rýmisþáttar (rooms.ratings) — gildin ok/warn/danger/mjog_alvarleg. */
  rating: {
    ok: "Viðunandi",
    warn: "Athugasemd",
    danger: "Alvarleg athugasemd",
    mjog_alvarleg: "Mjög alvarleg athugasemd",
  } as Record<string, string>,
  /** Heiti matsþátta; íslenska sýnir lykilinn sjálfan (t.d. „golfefni“) eins og áður. */
  ratingCategories: {} as Record<string, string>,
  /** Heiti athugasemdaflokka; íslenska sýnir geymda gildið. */
  categories: {} as Record<string, string>,

  actionList: "Verkefnalisti",
  actionListIntro: "Hér er verkefnalisti yfir atriði sem þarf að taka á.",

  termsHeading: "Skilmálar og fyrirvarar ástandsskoðunar {company}",
  /** Aðeins notað utan íslensku (íslenskir skilmálar eru fullur texti í page.tsx). */
  termsLinkOnly: "Skoðunin og skýrslan falla undir skilmála {company}:",

  reportCreated: "Skýrsla gerð",
};

export type ReportCopy = typeof is;

const en: ReportCopy = {
  docTitle: "Condition inspection",
  downloadFallbackAddress: "Inspection report",

  coverTitle: "Condition inspection",
  coverPhotoAlt: "Cover photo",
  noCoverPhoto: "No cover photo",
  customer: "Client",
  inspectionDate: "Inspection date",
  inspector: "Inspector",

  toc: "Contents",
  tocIntro: "Introduction and rating system",
  tocSummary: "Summary",
  tocRoom: "{name}",
  tocActionList: "Action list",
  tocTerms: "Terms and conditions",

  introHeading: "Condition inspection by {company}",
  introPurpose:
    "This report describes the general, visible condition of the property at the time of the inspection. It is based on an impartial visual inspection by {company} and is intended to inform a property transaction or an owner's assessment of their own property. The inspection and this report cover only the property inspected and only the items specifically mentioned in the report.",
  termsLinkBefore: "All inspections are subject to",
  termsLinkText: "the terms and conditions of {company}",

  ratingSystem: "Rating system",
  ratingSystemHow:
    "How the rating system works: every observation in the report is given a rating that shows how serious the damage is. Severity is assessed from the consequences the damage can have for the building element or the building, and from how important it is to repair it.",
  ratingSystemTypes: "The report uses three types of observation.",
  severity: {
    athugasemd: {
      label: "Minor",
      short: "Minor",
      description: "Damage that does not affect how the building element or the building functions.",
    },
    alvarleg: {
      label: "Serious",
      short: "Serious",
      description:
        "Damage that impairs the function of the building element in the longer term. It can cause damage to other building elements.",
    },
    mjog_alvarleg: {
      label: "Very serious",
      short: "Very serious",
      description:
        "Damage that has already impaired, or will soon impair, the function of the building element. It can cause, or has already caused, damage to other building elements.",
    },
  },

  conditionRatingSystemHow:
    "How the rating system works: every observation in the report is given a condition rating from 1 to 3. The rating shows how serious the defect is and how urgently it needs attention.",
  conditionRatingSystemTypes: "The report uses three condition ratings.",
  conditionSeverity: {
    athugasemd: {
      label: "Condition rating 1",
      short: "Rating 1",
      description: "No repair is needed at present. Maintain in the normal way.",
    },
    alvarleg: {
      label: "Condition rating 2",
      short: "Rating 2",
      description: "A defect that needs repairing or replacing, but is not considered serious or urgent.",
    },
    mjog_alvarleg: {
      label: "Condition rating 3",
      short: "Rating 3",
      description: "A serious defect, or one that needs to be repaired, replaced or investigated urgently.",
    },
  },
  conditionRating: {
    ok: "Acceptable",
    warn: "Rating 1",
    danger: "Rating 2",
    mjog_alvarleg: "Rating 3",
  },

  summary: "Summary",
  introduction: "Introduction",
  propertyDescription: "Property description",
  conclusion: "Conclusion",
  property: "Property",
  address: "Address",
  postcode: "Postcode",
  propertyId: "Property ID",
  propertyType: "Type",
  size: "Size",
  yearBuilt: "Year built",
  buildStage: "Build stage",
  inspection: "Inspection",
  attendees: "Present",
  weather: "Weather",
  roomCount: "Rooms",
  observationCount: "Observations",
  photoCount: "Photos",

  roomNotes: "Notes on this room:",
  suggestion: "Recommendation:",
  noObservations: "No observations in this room.",
  rating: {
    ok: "Acceptable",
    warn: "Minor",
    danger: "Serious",
    mjog_alvarleg: "Very serious",
  },
  ratingCategories: {
    golfefni: "Flooring", veggir: "Walls", loft: "Ceiling", hurdir: "Doors", gluggar: "Windows",
    rafmagn: "Electrical", birta: "Lighting", loftraesting: "Ventilation", skapar: "Cabinets",
    lagnir: "Plumbing", innrettingar: "Fittings", eldavel: "Cooker", ofn: "Oven",
    hafur: "Extractor hood", uppthvottavel: "Dishwasher", isskapur: "Refrigerator", vaskur: "Sink",
    blondunartaeki: "Taps", fraraennsli: "Drainage", flisar: "Tiling", klosett: "Toilet",
    badker_sturta: "Bath / shower", sturtuhengi: "Shower enclosure", nidurfall: "Floor drain",
    raki: "Moisture", gufutaeki: "Extractor fan", thvottavel_tengingar: "Washing machine connections",
    thurrkari: "Dryer", arinn: "Fireplace", utihurd: "Entrance door", speglar: "Mirrors",
    einangrun: "Insulation", bilskurshurd: "Garage door", thakefni: "Roof covering",
    rennur: "Gutters", nidurfollum: "Downpipes", reykhafur: "Chimney", thaklufting: "Roof ventilation",
    thakkantar: "Roof edges", thaktap: "Roof seams", klaedning: "Cladding", mulning: "Render",
    sprungur: "Cracks", malning: "Paint", utihurdir: "Exterior doors", sokkull: "Plinth",
    lod: "Grounds / drainage", handrid: "Handrail", threp: "Steps", svalahurd: "Balcony door",
    girding: "Fence", pallar: "Decking", gangstig: "Paths", dren: "Drainage", gardplontur: "Planting",
    adaltafla: "Main panel", dreifikerfi: "Distribution", jardtenging: "Earthing",
    rofi_innstungur: "Switches / sockets", lysing: "Lighting", kaplar: "Cables",
  },
  categories: {
    "Veggir": "Walls", "Gólfefni": "Flooring", "Loft": "Ceiling", "Hurðir": "Doors", "Gluggar": "Windows",
    "Skápar": "Cabinets", "Rafmagn": "Electrical", "Lagnir": "Plumbing", "Loftræsting": "Ventilation",
    "Þak": "Roof", "Einangrun": "Insulation", "Raki": "Moisture", "Burðarvirki": "Structure", "Annað": "Other",
    "Þakefni": "Roof covering", "Niðurföll": "Downpipes", "Múr": "Render", "Málning": "Paint", "Flísar": "Tiling",
  },

  actionList: "Action list",
  actionListIntro: "These are the items that need attention, most serious first.",

  termsHeading: "Terms and conditions",
  termsLinkOnly: "This inspection and report are subject to the terms and conditions of {company}:",

  reportCreated: "Report created",
};

export const REPORT_COPY: Readonly<Record<ReportLocale, ReportCopy>> = { is, en };

export function reportCopy(locale: ReportLocale): ReportCopy {
  return REPORT_COPY[locale];
}

/** Heiti matsþáttar í rooms.ratings; íslenska: lykillinn með bilum (eins og áður). */
export function ratingCategoryLabel(copy: ReportCopy, key: string): string {
  return copy.ratingCategories[key] ?? key.replace(/_/g, " ");
}

/** Birtingarheiti athugasemdaflokks; geymda gildið ef engin þýðing er til. */
export function reportCategoryLabel(copy: ReportCopy, category: string): string {
  return copy.categories[category] ?? category;
}
