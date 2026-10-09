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

  // NZ-matsorð (companies.rating_scheme = nz_terms; sjálfgefið fyrir NZS 4306). Aðeins
  // birting: athugasemd → Maintenance, alvarleg → Defect, mjog_alvarleg → Significant defect;
  // rýmiseinkunn ok/warn/danger/mjog_alvarleg → Satisfactory/Maintenance/Defect/Significant defect.
  nzRatingSystemHow:
    "Svona virkar matskerfið: hver athugasemd í skýrslunni er flokkuð sem viðhald, galli eða verulegur galli eftir því hversu alvarleg hún er og hversu brýnt er að bregðast við henni.",
  nzRatingSystemTypes: "Í skýrslunni eru notaðir þrír flokkar athugasemda.",
  nzSeverity: {
    athugasemd: {
      label: "Viðhald",
      short: "Viðhald",
      description: "Slit eða minniháttar ágalli sem sinna ætti í venjulegu viðhaldi.",
    },
    alvarleg: {
      label: "Galli",
      short: "Galli",
      description: "Galli sem þarf að gera við eða endurnýja. Hann er ekki brýnn en getur valdið frekara tjóni ef ekkert er gert.",
    },
    mjog_alvarleg: {
      label: "Verulegur galli",
      short: "Verulegur galli",
      description: "Galli sem krefst umfangsmikillar viðgerðar eða brýnnar athygli.",
    },
  } as Record<SeverityKey, { label: string; short: string; description: string }>,
  nzRating: {
    ok: "Viðunandi",
    warn: "Viðhald",
    danger: "Galli",
    mjog_alvarleg: "Verulegur galli",
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
  /** Tengill á skilmála fyrirtækis (annarra en Beton, sem fær fullan texta í page.tsx). */
  termsLinkOnly: "Skoðunin og skýrslan falla undir skilmála {company}:",
  // Hlutlaus kafli fyrir öll fyrirtæki önnur en Beton (ákvörðun eiganda 2026-09-27):
  // takmarkanir sjónskoðunar, engir greiðslu- eða ábyrgðarskilmálar. Lögfræðingur ætti
  // að lesa hann yfir. Eigin skilmálar fyrirtækis (inspectors.company_terms_text) á eftir.
  limitationsHeading: "Takmarkanir skoðunar",
  limitations: [
    "Skýrslan byggir á sjónskoðun án inngrips á aðgengilegum hlutum eignarinnar á skoðunardegi. Hún lýsir því ástandi sem sást þá og er ekki trygging fyrir því að eignin sé gallalaus.",
    "Hlutar sem voru huldir, lokaðir eða óaðgengilegir voru ekki skoðaðir, til dæmis inni í veggjum, undir gólfefnum, bak við innréttingar og hlutar þaks eða ytra byrðis sem ekki var hægt að skoða með öruggum hætti. Lagnir, raflagnir, frárennsli og hitakerfi voru aðeins skoðuð sjónrænt þar sem þau voru aðgengileg; þau voru ekki prófuð.",
    "Rakamælingar eru aðeins til viðmiðunar. Raki, mygla eða aðrir gallar geta leynst í byggingarhlutum án sýnilegra ummerkja.",
    "Nánari athugun eða viðgerð á göllum sem lýst er í skýrslunni getur leitt í ljós aðra galla sem ekki voru sýnilegir við skoðun.",
    "Skýrslan er ætluð þeim viðskiptavini sem hún er gerð fyrir. Ekki ætti að byggja ákvörðun um kaup, sölu eða viðgerðir eingöngu á henni.",
  ],
  ownTermsHeading: "Skilmálar {company}",

  reportCreated: "Skýrsla gerð",
  /** Fótur PDF-síðu (render-pdf.ts): „Bls. 3 / 12“. */
  pageLabel: "Bls.",
  /** „Page 3 of 12“ í fæti skýrslna með fyrirtækisnafni (ekki-íslenskar); íslenski fóturinn er áfram „Bls. 3 / 12“. */
  pageOfLabel: "af",
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
  tocTerms: "Limitations and terms",

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

  nzRatingSystemHow:
    "How the rating system works: every observation in the report is classed as maintenance, a defect or a significant defect, according to how serious it is and how urgently it needs attention.",
  nzRatingSystemTypes: "The report uses three classes of observation.",
  nzSeverity: {
    athugasemd: {
      label: "Maintenance",
      short: "Maintenance",
      description: "Wear or a minor fault that should be dealt with as part of normal maintenance.",
    },
    alvarleg: {
      label: "Defect",
      short: "Defect",
      description: "A fault that needs repairing or replacing. It is not urgent, but it may lead to further damage if left.",
    },
    mjog_alvarleg: {
      label: "Significant defect",
      short: "Significant defect",
      description: "A defect that needs substantial repair or urgent attention.",
    },
  },
  nzRating: {
    ok: "Satisfactory",
    warn: "Maintenance",
    danger: "Defect",
    mjog_alvarleg: "Significant defect",
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

  termsHeading: "Limitations and terms",
  termsLinkOnly: "This inspection and report are subject to the terms and conditions of {company}:",
  limitationsHeading: "Limitations of this inspection",
  limitations: [
    "This report is based on a visual, non-invasive inspection of the accessible parts of the property on the date of the inspection. It describes the condition seen at that time and is not a guarantee that the property is free of defects.",
    "Parts that were concealed, covered or inaccessible were not inspected, for example inside walls, under floor coverings, behind fitted units, and parts of the roof or exterior that could not be inspected safely. Plumbing, electrics, drainage and heating were only inspected visually where accessible; they were not tested.",
    "Moisture readings are indicative only. Damp, mould or other defects can be present in building elements without visible signs.",
    "Further investigation or repair of a defect described in this report may reveal other defects that were not visible at the time of the inspection.",
    "This report is intended for the client it was prepared for. A decision to buy, sell or carry out repairs should not be based on this report alone.",
  ],
  ownTermsHeading: "{company} terms and conditions",

  reportCreated: "Report created",
  pageLabel: "Page",
  pageOfLabel: "of",
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
