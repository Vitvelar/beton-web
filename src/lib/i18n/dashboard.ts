import type { Brand } from "@/lib/brand";

// Textar stjórnborðsins, einn hlutur á hvert tungumál (locale). Tungumálið er
// valið á EINUM stað, getDashboardLocale() í src/lib/request-brand.ts:
//   admin.beton.is → is (Beton, texti óbreyttur bæti fyrir bæti)
//   app.rondva.com → en (Rondva; seinna val notandans, sjá localeForBrand)
//
// Server components kalla dashboardCopy(await getDashboardLocale()).
// Client components fá `locale` sem prop (föll í katalóginu fara ekki yfir
// server→client mörkin) og velja textann sjálf.
//
// Nýtt tungumál = bæta kóðanum í DASHBOARD_LOCALES og einum `DashboardCopy`-
// hlut í DASHBOARD_COPY; TypeScript krefst þá allra lykla.
//
// Texti með breytum sem birtist í JSX er sniðmát með {nafni} og er birtur með
// fill() — hún skilar sömu textahnútum og JSX-ið gerði áður, svo Beton helst
// pixla-eins. Fleirtala fer um plural() (Intl.PluralRules, form eftir tungumáli).
// Föll eru aðeins notuð fyrir skilaboð sem verða að einum streng (villur o.þ.h.).
//
// Skýrslan sjálf (/dashboard/[id]/report + src/lib/report/*) er EKKI hér —
// tungumál skýrslunnar er sér mál (plan/rondva/HANDOFF-2026-09-24.md §7.4).
// Alvarleiki og athugasemdaflokkar fylgja beton-app lib/i18n/labels.ts svo
// orðaforðinn sé sá sami og í enska appinu. Geymd gildi breytast aldrei.

export const DASHBOARD_LOCALES = ["is", "en"] as const;
export type DashboardLocale = (typeof DASHBOARD_LOCALES)[number];

/** Heiti hvers tungumáls á því sjálfu (birt í tungumálavalinu, aldrei þýtt). */
export const LOCALE_NAMES: Readonly<Record<DashboardLocale, string>> = {
  is: "Íslenska",
  en: "English",
};

/**
 * Lykill tungumálavalsins í user_metadata Supabase-notandans. Appið (beton-app
 * lib/i18n) les og skrifar SAMA lykil svo val á öðrum staðnum gildi á hinum.
 * Aðeins birtingarval — notandinn getur breytt user_metadata sjálfur, svo
 * aðgangur eða auðkenni má aldrei byggja á því.
 */
export const USER_LOCALE_KEY = "ui_locale";

export function isDashboardLocale(value: unknown): value is DashboardLocale {
  return (DASHBOARD_LOCALES as readonly unknown[]).includes(value);
}

/**
 * Tungumál stjórnborðsins. Beton er alltaf á íslensku. Rondva er á ensku nema
 * notandinn hafi valið annað studd tungumál (`preferred` = user_metadata.ui_locale).
 */
export function localeForBrand(brand: Brand, preferred?: string | null): DashboardLocale {
  if (brand !== "rondva") return "is";
  return isDashboardLocale(preferred) ? preferred : "en";
}

import type { PluralForms } from "./format";
export { fill, format, plural, type PluralForms } from "./format";

const is = {
  common: {
    back: "Til baka",
    backLink: "← Til baka",
  },
  header: {
    section: "Stjórnborð",
    settings: "Stillingar",
    signOut: "Útskrá",
  },
  language: {
    title: "Tungumál",
    hint: "Notað í stjórnborðinu og í Rondva-appinu.",
    saveFailed: "Ekki tókst að vista tungumálið. Reyndu aftur.",
  },
  // Skýrslustillingar fyrirtækis (aðeins eigandi, app.rondva.com).
  reportSettings: {
    title: "Skýrslur",
    language: "Tungumál skýrslna",
    languageHint: "Nýjar skýrslur eru skrifaðar á þessu máli. Skýrslur sem þegar eru til halda sínu máli.",
    scheme: "Matskerfi",
    schemeStandard: "Athugasemd / Alvarleg / Mjög alvarleg",
    schemeCondition: "Ástandseinkunnir 1–3",
    schemeNz: "Viðunandi / Viðhald / Galli / Verulegur galli (NZ)",
    schemeHint: "Hvernig alvarleiki birtist í skýrslum. Skráð gögn breytast ekki.",
    standard: "Skýrslusnið",
    standardDefault: "Staðlað",
    standardNzs: "NZS 4306:2005",
    standardHint: "NZS 4306:2005 er nýsjálenska sniðið fyrir skoðun fyrir kaup (á ensku). Gildir um nýjar skýrslur.",
    saving: "Vista…",
    saved: "Vistað. Gildir um nýjar skýrslur.",
    saveFailed: "Ekki tókst að vista skýrslustillingar. Reyndu aftur.",
  },
  status: {
    draft: "Drög",
    inspecting: "Í vinnslu",
    completed: "Lokið",
  },
  severity: {
    athugasemd: "Athugasemd",
    alvarleg: "Alvarleg",
    mjog_alvarleg: "Mjög alvarleg",
  },
  // Sama alvarleiki sem ástandseinkunnir (companies.rating_scheme = condition_1_3).
  conditionSeverity: {
    athugasemd: "Einkunn 1",
    alvarleg: "Einkunn 2",
    mjog_alvarleg: "Einkunn 3",
  },
  // Sami alvarleiki með NZ-matsorðum (companies.rating_scheme = nz_terms).
  nzSeverity: {
    athugasemd: "Viðhald",
    alvarleg: "Galli",
    mjog_alvarleg: "Verulegur galli",
  },
  // Birtingarheiti athugasemdaflokka. Íslenska birtir geymda gildið sjálft.
  categories: {} as Record<string, string>,
  list: {
    loadError: "Villa við að sækja skoðanir: {message}",
    emptyTitle: "Engar skoðanir fundust",
    emptyBody: "Skoðanir sem eru samstilltar úr appinu birtast hér.",
    title: "Skoðanir",
    address: "Heimilisfang",
    customer: "Viðskiptavinur",
    date: "Dagsetning",
    rooms: "Rými",
    observations: "Ath.",
    status: "Staða",
  },
  inspection: {
    statRooms: "Rými",
    statObservations: "Athugasemdir",
    statPhotos: "Myndir",
    property: "Eign",
    propertyId: "Fastanúmer",
    type: "Tegund",
    size: "Stærð",
    yearBuilt: "Byggingarár",
    buildStage: "Byggingarstig",
    inspection: "Skoðun",
    customer: "Viðskiptavinur",
    date: "Dagsetning",
    inspector: "Skoðunarmaður",
    attendees: "Viðstaddir",
    weather: "Veður",
    roomsHeading: "Rými ({count})",
    noRooms: "Engin rými skráð. Samstilltu skoðunina úr appinu.",
    roomObservations: "{count} ath.",
    roomPhotos: { other: "{count} myndir" } as PluralForms,
    noObservations: "Engar athugasemdir í þessu rými.",
    photosHeading: "Myndir ({count})",
  },
  reportActions: {
    title: "Skýrsla",
    generating: "Bý til skýrslu...",
    regenerate: "Endurgera skýrslu",
    create: "Búa til skýrslu",
    view: "Skoða skýrslu",
    editText: "Breyta texta",
    downloadPdf: "Sækja PDF",
    sendingToDrive: "Sendi í Drive...",
    sendToDrive: "Senda í Google Drive",
    inProgressTitle: "Skýrslugerð í gangi",
    inProgressBody:
      "AI er að lesa athugasemdir og myndir. Þetta getur tekið smá stund í stórum skoðunum.",
    confirmFailed:
      "Ekki tókst að staðfesta skýrslugerðina. Athugaðu tenginguna og stöðu skoðunarinnar.",
    sentToDrive: "Skýrsla send í Google Drive.",
    sentToDriveShort: "Sent í Drive.",
  },
  reportProgress: {
    ready: "Skýrslan er tilbúin.",
    pending: "PDF-skýrslan er í vinnslu…",
    attention: "Athuga þarf stöðu skýrslunnar.",
    pendingHint: "Þú færð staðfestingu hér þegar hún er tilbúin.",
    openPdf: "Opna PDF-skýrslu",
    slow: "Vinnslan tekur lengri tíma en venjulega. Hún getur enn verið í gangi; þú þarft ekki að hefja nýja AI-keyrslu.",
    unreachable:
      "Ekki næst samband til að athuga stöðuna. Skýrslugerðin getur samt haldið áfram. Athugaðu stöðuna aftur.",
    retry: "Athuga stöðu aftur",
    openInspection: "Opna skoðun",
  },
  observation: {
    photosHeading: "Myndir ({count})",
    title: "Titill",
    category: "Flokkur",
    chooseCategory: "— Veldu flokk —",
    severity: "Alvarleiki",
    description: "Lýsing",
    descriptionPlaceholder: "Ítarleg lýsing á athugasemd...",
    suggestion: "Tillaga",
    suggestionPlaceholder: "Tillaga að úrbótum...",
    saving: "Vista...",
    save: "Vista breytingar",
    saved: "Vistað",
  },
  photos: {
    loading: "Hleð...",
    thermal: "Hiti",
    loadingPhoto: "Hleð mynd...",
  },
  reportEditor: {
    title: "Breyta skýrslutexta",
    subtitle: { other: "{address} — {count} athugasemdir" } as PluralForms,
    intro:
      "Hér má lagfæra eða eyða texta sem AI skrifaði án þess að keyra skýrslugerðina aftur. Tóm tillaga birtist ekki í skýrslunni.",
    summary: "1. Samantekt",
    introduction: "Inngangur",
    propertyDescription: "Eignalýsing",
    conclusion: "Niðurstaða",
    noObservations: "Engar athugasemdir í þessu rými.",
    description: "Lýsing",
    suggestion: "Tillaga",
    deleteSuggestion: "Eyða tillögu",
    emptySuggestion: "(engin tillaga — birtist ekki í skýrslu)",
    saveAndRegenerate: "Vista og endurgera PDF",
    saveWithoutPdf: "Vista án PDF",
    viewReport: "Skoða skýrslu",
    savedNoPdf: "Breytingar vistaðar. PDF-ið uppfærist ekki fyrr en það er endurgert.",
    savedWhileRendering:
      "Vistað — en PDF-gerð var þegar í gangi með eldri texta. Ýttu aftur á „Vista og endurgera PDF“ eftir ~1 mínútu svo breytingarnar skili sér í PDF-ið.",
    saveUnconfirmed: "Ekki tókst að staðfesta vistun. Athugaðu tenginguna og reyndu aftur.",
  },
  settings: {
    metaTitle: "Stillingar",
    eyebrow: "Stillingar",
    title: "Fyrirtæki og merki",
    backToList: "← Skoðanir",
    noInspector:
      "Enginn skoðunarmaður er skráður á þennan aðgang ennþá. Opnaðu appið einu sinni svo skoðunarmannsprófíllinn verði til, og komdu svo aftur hingað.",
    inspectorNote:
      "Skoðunarmaður: {name}. Nafnið á skýrslunni kemur úr skoðuninni sjálfri ef það er skráð þar.",
  },
  branding: {
    companyName: "Nafn fyrirtækis",
    companyNamePlaceholder: "t.d. Beton ehf.",
    companyNameHint: "Birtist á forsíðu skýrslu, í inngangi og í skilmálum.",
    termsUrl: "Slóð á skilmála (valfrjálst)",
    termsUrlHint: "Ef tómt er setningin um skilmála ekki í skýrslunni.",
    termsText: "Eigin skilmálar (valfrjálst)",
    termsTextHint:
      "Birtast aftast í skýrslum ykkar, á eftir almennum fyrirvörum um takmarkanir skoðunar. Aðeins venjulegur texti.",
    qualifications: "Réttindi þín (valfrjálst)",
    qualificationsPlaceholder: "t.d. NZIBI member, LBP 123456",
    qualificationsHint: "Birtist í skoðunarvottorði (Certificate of Inspection) NZS 4306-skýrslna.",
    logo: "Merki",
    logoAlt: "Merki",
    noLogo: "Ekkert merki",
    logoHint:
      "PNG, JPG, WebP eða SVG, mest 2 MB. Best er merki með gegnsæjum bakgrunni, a.m.k. 600 px á breidd.",
    removeLogo: "Fjarlægja merki",
    saving: "Vista…",
    save: "Vista",
    saved: "Vistað. Nýjar skýrslur nota þessar upplýsingar.",
    logoTooLarge: "Merkið má mest vera 2 MB.",
    uploadFailed: (message: string) => `Upphleðsla mistókst: ${message}`,
    genericError: "Villa kom upp.",
  },
  // Innskráningarleiðir í Stillingum (SignInMethods, aðeins á app.rondva.com).
  // Aðeins „tengja" — engin aftenging (plan/rondva/INNSKRANINGARLEIDIR-HONNUN.md D1).
  signInMethods: {
    title: "Innskráningarleiðir",
    intro:
      "Tengdu fleiri leiðir til að skrá þig inn á þennan sama aðgang. Allar tengdar leiðir opna sömu skoðanir og stillingar.",
    // Heiti innskráningarleiða eftir `provider` í Supabase; óþekkt heiti birtist óbreytt.
    providers: {
      google: "Google",
      apple: "Apple",
      azure: "Microsoft",
      email: "Netfang",
    } as Record<string, string>,
    hiddenEmail: "Netfang falið hjá Apple",
    linkGoogle: "Tengja Google",
    linkAnotherGoogle: "Tengja annan Google-reikning",
    linkApple: "Tengja Apple",
    linkAnotherApple: "Tengja annað Apple-auðkenni",
    opening: "Opna {provider}…",
    linkHint:
      "Þú skráir þig inn með reikningnum sem á að bætast við og kemur svo aftur hingað.",
    removeNote: "Viltu fjarlægja innskráningarleið? Skrifaðu á {email}.",
    linked: "Innskráningarleiðin er tengd. Þú getur nú skráð þig inn með henni.",
    identityAlreadyExists:
      "Þessi reikningur er þegar tengdur, annaðhvort þessum aðgangi eða öðrum Rondva-aðgangi. Ef þú átt tvo aðganga, hafðu samband og við hjálpum þér.",
    manualLinkingDisabled:
      "Ekki er enn hægt að tengja innskráningarleiðir. Reyndu aftur síðar.",
    linkFailed:
      "Tengingin kláraðist ekki. Glugginn gæti hafa lokast eða tíminn runnið út. Reyndu aftur.",
  },
  // Villutextar server-aðgerða í [id]/actions.ts.
  actions: {
    unknownError: "Óþekkt villa",
    generateFailed: "Ekki tókst að búa til skýrsluna. Reyndu aftur eftir smástund.",
    signInToGenerate: "Innskráningin er útrunnin. Skráðu þig inn aftur og reyndu svo aftur.",
    inspectionNotFound: "Skoðun fannst ekki.",
    noObservations: "Engar athugasemdir skráðar — ekki er hægt að búa til skýrslu.",
    observationUpdateFailed: (message: string) => `Uppfærsla athugasemdar mistókst: ${message}`,
    queueFailed: (message: string) => `Tókst ekki að setja PDF í biðröð: ${message}`,
    noAiReport: "Engin skýrsla til — búðu fyrst til skýrslu með AI.",
    textChangedElsewhere:
      "Skýrslutextinn hefur breyst síðan ritillinn var opnaður (t.d. ný skýrslugerð eða vistun annars staðar). Endurhladdu síðuna og gerðu breytingarnar aftur.",
    reportUpdateFailed: (message: string) => `Uppfærsla skýrslu mistókst: ${message}`,
    signInAgain: "Skráðu þig inn aftur til að sjá stöðu skýrslunnar.",
    statusFetchFailed: "Tókst ekki að sækja stöðu skýrslunnar.",
    inspectionGone: "Skoðunin fannst ekki eða aðgangur er ekki lengur til staðar.",
    reportFailed: "Skýrslugerð mistókst. Opnaðu skoðunina til að reyna aftur.",
    noPdfForStatus:
      "Engin tilbúin PDF-skrá fannst fyrir núverandi stöðu. Opnaðu skoðunina til að athuga hana.",
    driveBetonOnly: "Google Drive er aðeins í boði fyrir Beton.",
    noReportForDrive: "Engin skýrsla til. Búðu til skýrslu fyrst.",
    reportDownloadFailed: (message: string | undefined) => `Gat ekki sótt skýrslu: ${message}`,
  },
  // Höfnun skýrsluinneignar (error_code frá edge-fallinu generate-report).
  credits: {
    ledger_unavailable: "Ekki tókst að staðfesta skýrsluinneign. Reyndu aftur eftir smástund.",
    no_credits:
      "Ókeypis AI-skýrslurnar eru búnar. Handvirkar breytingar og endurútflutningur eru áfram ókeypis.",
    additional_credit_confirmation_required:
      "Innifaldar AI-endurgerðir fyrir þessa skýrslu eru búnar. Þú getur áfram breytt textanum og flutt skýrsluna út.",
    in_progress: "Verið er að búa til skýrslu fyrir þessa skoðun.",
    not_active: "Fyrirtækjaaðgangurinn er ekki virkur.",
  },
  // Nýskráning fyrirtækis (/dashboard/onboarding, AÐEINS app.rondva.com — Beton
  // birtir þetta aldrei). Íslenskan er fyrir Rondva-notendur sem velja íslensku.
  onboarding: {
    metaTitle: "Skrá fyrirtæki",
    eyebrow: "Fyrstu skref",
    title: "Skráðu fyrirtækið",
    intro:
      "Rondva-aðgangur tilheyrir fyrirtæki. Segðu okkur fyrir hvaða fyrirtæki þú skoðar og við setjum upp vinnusvæðið.",
    signedInAs: "Skráð inn sem {email}",
    nameLabel: "Nafn fyrirtækis",
    namePlaceholder: "t.d. Dæmi ehf.",
    nameHint: "Eins og það á að birtast á skýrslum. Einyrki? Notaðu nafnið sem þú starfar undir.",
    countryLabel: "Land",
    countryPlaceholder: "Veldu land",
    countryHint: "Landið þar sem fyrirtækið starfar.",
    websiteLabel: "Vefsíða",
    optional: "valfrjálst",
    websitePlaceholder: "fyrirtaeki.is",
    websiteHint: "Hjálpar okkur að staðfesta fyrirtækið.",
    submit: "Skrá fyrirtæki",
    submitting: "Skrái…",
    nameRequired: "Sláðu inn nafn fyrirtækisins.",
    nameLength: "Nafnið þarf að vera 2–120 stafir.",
    countryRequired: "Veldu landið þar sem fyrirtækið starfar.",
    websiteInvalid: "Sláðu inn vefsíðu eins og fyrirtaeki.is, eða hafðu reitinn tóman.",
    failed: "Ekki tókst að skrá fyrirtækið. Reyndu aftur eftir smástund.",
    otherAccount: "Skráð inn með röngum reikningi?",
    signOut: "Skrá út",
    pendingEyebrow: "Skráning móttekin",
    pendingTitle: "Við förum yfir fyrirtækið",
    pendingBody:
      "Við förum yfir hvert nýtt fyrirtæki áður en aðgangur opnast — yfirleitt innan eins virks dags. Þegar það hefur verið samþykkt kemstu inn, hér og í Rondva-appinu, með sömu innskráningu.",
    checkAgain: "Athuga aftur",
    contact: "Spurningar? Skrifaðu á {email}.",
  },
};

export type DashboardCopy = typeof is;

const en: DashboardCopy = {
  common: {
    back: "Back",
    backLink: "← Back",
  },
  header: {
    section: "Dashboard",
    settings: "Settings",
    signOut: "Sign out",
  },
  language: {
    title: "Language",
    hint: "Used in the dashboard and the Rondva app.",
    saveFailed: "Could not save the language. Please try again.",
  },
  reportSettings: {
    title: "Reports",
    language: "Report language",
    languageHint: "New reports are written in this language. Reports that already exist keep theirs.",
    scheme: "Rating scheme",
    schemeStandard: "Minor / Serious / Very serious",
    schemeCondition: "Condition ratings 1–3",
    schemeNz: "Satisfactory / Maintenance / Defect / Significant defect (NZ)",
    schemeHint: "How severity is shown in reports. Your recorded data doesn't change.",
    standard: "Report format",
    standardDefault: "Standard",
    standardNzs: "NZS 4306:2005",
    standardHint: "NZS 4306:2005 is the New Zealand pre-purchase inspection format (in English). Applies to new reports.",
    saving: "Saving…",
    saved: "Saved. Applies to new reports.",
    saveFailed: "Could not save the report settings. Please try again.",
  },
  status: {
    draft: "Draft",
    inspecting: "In inspection",
    completed: "Completed",
  },
  severity: {
    athugasemd: "Minor",
    alvarleg: "Serious",
    mjog_alvarleg: "Very serious",
  },
  conditionSeverity: {
    athugasemd: "Rating 1",
    alvarleg: "Rating 2",
    mjog_alvarleg: "Rating 3",
  },
  nzSeverity: {
    athugasemd: "Maintenance",
    alvarleg: "Defect",
    mjog_alvarleg: "Significant defect",
  },
  categories: {
    "Veggir": "Walls",
    "Gólfefni": "Flooring",
    "Loft": "Ceiling",
    "Hurðir": "Doors",
    "Gluggar": "Windows",
    "Skápar": "Cabinets",
    "Rafmagn": "Electrical",
    "Lagnir": "Plumbing",
    "Loftræsting": "Ventilation",
    "Þak": "Roof",
    "Einangrun": "Insulation",
    "Raki": "Moisture",
    "Burðarvirki": "Structure",
    "Annað": "Other",
    // Flokkar úr kynningargögnum appsins (ekki í valmyndinni).
    "Þakefni": "Roof covering",
    "Niðurföll": "Downpipes",
    "Múr": "Render",
    "Málning": "Paint",
    "Flísar": "Tiling",
  },
  list: {
    loadError: "Could not load inspections: {message}",
    emptyTitle: "No inspections yet",
    emptyBody: "Inspections synced from the app appear here.",
    title: "Inspections",
    address: "Address",
    customer: "Customer",
    date: "Date",
    rooms: "Rooms",
    observations: "Obs.",
    status: "Status",
  },
  inspection: {
    statRooms: "Rooms",
    statObservations: "Observations",
    statPhotos: "Photos",
    property: "Property",
    propertyId: "Property ID",
    type: "Type",
    size: "Size",
    yearBuilt: "Year built",
    buildStage: "Build stage",
    inspection: "Inspection",
    customer: "Customer",
    date: "Inspection date",
    inspector: "Inspector",
    attendees: "Attendees",
    weather: "Weather",
    roomsHeading: "Rooms ({count})",
    noRooms: "No rooms recorded. Sync the inspection from the app.",
    roomObservations: "{count} obs.",
    roomPhotos: { one: "{count} photo", other: "{count} photos" },
    noObservations: "No observations in this room.",
    photosHeading: "Photos ({count})",
  },
  reportActions: {
    title: "Report",
    generating: "Creating report...",
    regenerate: "Regenerate report",
    create: "Create report",
    view: "View report",
    editText: "Edit text",
    downloadPdf: "Download PDF",
    sendingToDrive: "Sending to Drive...",
    sendToDrive: "Send to Google Drive",
    inProgressTitle: "Creating the report",
    inProgressBody:
      "The AI is reading the observations and photos. This can take a while for large inspections.",
    confirmFailed:
      "Could not confirm the report request. Check your connection and the inspection's status.",
    sentToDrive: "Report sent to Google Drive.",
    sentToDriveShort: "Sent to Drive.",
  },
  reportProgress: {
    ready: "The report is ready.",
    pending: "The PDF report is being generated…",
    attention: "The report status needs checking.",
    pendingHint: "You'll see a confirmation here when it's ready.",
    openPdf: "Open PDF report",
    slow: "This is taking longer than usual. It may still be running; you don't need to start a new AI run.",
    unreachable:
      "Can't reach the server to check the status. The report may still be generating. Check the status again.",
    retry: "Check status again",
    openInspection: "Open inspection",
  },
  observation: {
    photosHeading: "Photos ({count})",
    title: "Title",
    category: "Category",
    chooseCategory: "— Choose a category —",
    severity: "Severity",
    description: "Description",
    descriptionPlaceholder: "Detailed description of the observation...",
    suggestion: "Suggestion",
    suggestionPlaceholder: "Suggested repair...",
    saving: "Saving...",
    save: "Save changes",
    saved: "Saved",
  },
  photos: {
    loading: "Loading…",
    thermal: "Thermal",
    loadingPhoto: "Loading photo…",
  },
  reportEditor: {
    title: "Edit report text",
    subtitle: { one: "{address} — {count} observation", other: "{address} — {count} observations" },
    intro:
      "Correct or delete text the AI wrote without running report generation again. An empty suggestion is left out of the report.",
    summary: "1. Summary",
    introduction: "Introduction",
    propertyDescription: "Property description",
    conclusion: "Conclusion",
    noObservations: "No observations in this room.",
    description: "Description",
    suggestion: "Suggestion",
    deleteSuggestion: "Delete suggestion",
    emptySuggestion: "(no suggestion — left out of the report)",
    saveAndRegenerate: "Save and regenerate PDF",
    saveWithoutPdf: "Save without PDF",
    viewReport: "View report",
    savedNoPdf: "Changes saved. The PDF won't update until it's regenerated.",
    savedWhileRendering:
      "Saved — but a PDF was already being generated from the older text. Press “Save and regenerate PDF” again in about a minute so your changes reach the PDF.",
    saveUnconfirmed: "Could not confirm the save. Check your connection and try again.",
  },
  settings: {
    metaTitle: "Settings",
    eyebrow: "Settings",
    title: "Company & logo",
    backToList: "← Inspections",
    noInspector:
      "No inspector is registered on this account yet. Open the app once so your inspector profile is created, then come back here.",
    inspectorNote:
      "Inspector: {name}. The name on the report comes from the inspection itself if it's recorded there.",
  },
  branding: {
    companyName: "Company name",
    companyNamePlaceholder: "e.g. Northside Surveys Ltd",
    companyNameHint: "Appears on the report cover, in the introduction and in the terms.",
    termsUrl: "Terms URL (optional)",
    termsUrlHint: "If empty, the terms sentence is left out of the report.",
    termsText: "Your terms (optional)",
    termsTextHint:
      "Shown at the end of your reports, after the standard limitations of the inspection. Plain text only.",
    qualifications: "Your qualifications (optional)",
    qualificationsPlaceholder: "e.g. NZIBI member, LBP 123456",
    qualificationsHint: "Shown on the Certificate of Inspection in NZS 4306 reports.",
    logo: "Logo",
    logoAlt: "Logo",
    noLogo: "No logo",
    logoHint:
      "PNG, JPG, WebP or SVG, max 2 MB. A logo with a transparent background, at least 600 px wide, works best.",
    removeLogo: "Remove logo",
    saving: "Saving…",
    save: "Save",
    saved: "Saved. New reports will use this information.",
    logoTooLarge: "The logo must be at most 2 MB.",
    uploadFailed: (message) => `Logo upload failed: ${message}`,
    genericError: "Something went wrong.",
  },
  signInMethods: {
    title: "Sign-in methods",
    intro:
      "Link more ways to sign in to this same account. Every linked method opens the same inspections and settings.",
    providers: {
      google: "Google",
      apple: "Apple",
      azure: "Microsoft",
      email: "Email",
    },
    hiddenEmail: "Email hidden by Apple",
    linkGoogle: "Link Google",
    linkAnotherGoogle: "Link another Google account",
    linkApple: "Link Apple",
    linkAnotherApple: "Link another Apple ID",
    opening: "Opening {provider}…",
    linkHint: "You'll sign in with the account you want to add, then come back here.",
    removeNote: "Need to remove a sign-in method? Write to {email}.",
    linked: "Sign-in method linked. You can now use it to sign in.",
    identityAlreadyExists:
      "That account is already linked, either to this account or to another Rondva account. If you have two Rondva accounts, contact us and we'll help.",
    manualLinkingDisabled: "Linking sign-in methods isn't available yet. Please try again later.",
    linkFailed:
      "Linking didn't finish. The window may have been closed or timed out. Please try again.",
  },
  actions: {
    unknownError: "Unknown error",
    generateFailed: "The report could not be created. Please try again in a moment.",
    signInToGenerate: "Your session has expired. Sign in again and try again.",
    inspectionNotFound: "Inspection not found.",
    noObservations: "No observations recorded — a report can't be created.",
    observationUpdateFailed: (message) => `Updating the observation failed: ${message}`,
    queueFailed: (message) => `Could not queue the PDF: ${message}`,
    noAiReport: "There's no report yet — create one with AI first.",
    textChangedElsewhere:
      "The report text has changed since the editor was opened (for example a new report run or a save elsewhere). Reload the page and make your changes again.",
    reportUpdateFailed: (message) => `Updating the report failed: ${message}`,
    signInAgain: "Sign in again to see the report status.",
    statusFetchFailed: "Could not fetch the report status.",
    inspectionGone: "The inspection wasn't found, or you no longer have access to it.",
    reportFailed: "Report generation failed. Open the inspection to try again.",
    noPdfForStatus: "No finished PDF was found for the current status. Open the inspection to check it.",
    driveBetonOnly: "Google Drive is only available for Beton.",
    noReportForDrive: "There's no report yet. Create a report first.",
    reportDownloadFailed: (message) => `Could not fetch the report: ${message}`,
  },
  credits: {
    ledger_unavailable: "We couldn't check your report credits. Please try again in a moment.",
    no_credits:
      "You've used your free AI-drafted reports. Manual edits and re-exports stay free.",
    additional_credit_confirmation_required:
      "The included AI revisions for this report are used up. You can still edit the text and export the report.",
    in_progress: "An AI report is already being generated for this inspection.",
    not_active: "Your company account isn't active, so AI drafting isn't available.",
  },
  onboarding: {
    metaTitle: "Register your company",
    eyebrow: "Get started",
    title: "Register your company",
    intro:
      "Rondva accounts belong to a company. Tell us who you inspect for and we'll set up your workspace.",
    signedInAs: "Signed in as {email}",
    nameLabel: "Company name",
    namePlaceholder: "e.g. Northside Surveys Ltd",
    nameHint: "As it should appear on your reports. Working solo? Use your trading name.",
    countryLabel: "Country",
    countryPlaceholder: "Select a country",
    countryHint: "Where your company operates.",
    websiteLabel: "Website",
    optional: "optional",
    websitePlaceholder: "example.com",
    websiteHint: "Helps us confirm your company.",
    submit: "Register company",
    submitting: "Registering…",
    nameRequired: "Enter your company name.",
    nameLength: "Use between 2 and 120 characters.",
    countryRequired: "Choose the country your company operates in.",
    websiteInvalid: "Enter a website like example.com, or leave it empty.",
    failed: "We couldn't register your company just now. Please try again in a moment.",
    otherAccount: "Signed in with the wrong account?",
    signOut: "Sign out",
    pendingEyebrow: "Registration received",
    pendingTitle: "We're reviewing your company",
    pendingBody:
      "We review every new company before opening access — usually within one working day. Once it's approved, you're in: here and in the Rondva app, with the same sign-in.",
    checkAgain: "Check again",
    contact: "Questions? Write to {email}.",
  },
};

export const DASHBOARD_COPY: Readonly<Record<DashboardLocale, DashboardCopy>> = { is, en };

export function dashboardCopy(locale: DashboardLocale): DashboardCopy {
  return DASHBOARD_COPY[locale];
}

/** Birtingarheiti athugasemdaflokks; geymda gildið (íslenska) ef engin þýðing er til. */
export function categoryLabel(copy: DashboardCopy, category: string): string {
  return copy.categories[category] ?? category;
}
