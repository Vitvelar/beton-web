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
    backToInspections: "← Skoðanir",
    loading: "Hleð…",
    unsavedLeave: "Þú ert með óvistaðar breytingar. Viltu fara án þess að vista?",
  },
  // Villu- og „finnst ekki“-síður stjórnborðsins (error.tsx, not-found.tsx).
  errorPage: {
    title: "Eitthvað fór úrskeiðis",
    body: "Ekki tókst að hlaða þessa síðu. Reyndu aftur; ef það dugar ekki skaltu fara aftur í skoðanirnar.",
    retry: "Reyna aftur",
    reference: "Tilvísun: {digest}",
  },
  notFoundPage: {
    title: "Síðan fannst ekki",
    body: "Þessi síða er ekki til, eða þú hefur ekki aðgang að henni.",
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
    standardIsop: "Home inspection (US/Kanada, kerfisröð)",
    isopHint: "Skýrsla í kerfisröð fyrir Bandaríkin og Kanada (á ensku). Gildir um nýjar skýrslur.",
    schemeIsop: "Matsorð fyrir kerfisröð (US/Kanada)",
    isopUnavailable: "Þetta skýrslusnið er ekki komið í notkun enn. Engu var breytt.",
    texasNotice: "Texas requires the TREC REI 7-6 form; Rondva doesn't produce it.",
    saving: "Vista…",
    saved: "Vistað. Gildir um nýjar skýrslur.",
    saveFailed: "Ekki tókst að vista skýrslustillingar. Reyndu aftur.",
  },
  // Land fyrirtækis (stillingar, aðeins eigandi, aðeins app.rondva.com).
  companyCountry: {
    label: "Land fyrirtækis",
    hint: "Ræður heimilisfangssniði, skyldureitum og skýrslusniði nýrra skoðana. Skoðanir sem þú ert þegar byrjaður á halda öllu sem þú skráðir.",
    confirmTitle: "Breyta landi í {country}?",
    confirmBody:
      "Nýjar skoðanir fá heimilisfangssnið, skyldureiti og skýrslutexta fyrir {country}. Skoðanir sem þú ert þegar byrjaður á halda öllu sem þú skráðir.",
    clearedNzs: "Skýrslusniðið fer aftur í Staðlað, því NZS 4306:2005 er fyrir Nýja-Sjáland.",
    clearedIsop: "Skýrslusniðið fer aftur í Staðlað, því Home inspection er fyrir Bandaríkin og Kanada.",
    confirm: "Breyta landi",
    cancel: "Hætta við",
    saving: "Vista…",
    saved: "Landi breytt í {country}.",
    notOwner: "Aðeins eigandi fyrirtækisins getur breytt landinu.",
    notAllowed: "Þetta land er ekki í boði fyrir fyrirtækið þitt. Engu var breytt.",
    unavailable: "Ekki er hægt að breyta landinu enn. Engu var breytt.",
    failed: "Ekki tókst að breyta landinu. Engu var breytt — reyndu aftur.",
  },
  status: {
    draft: "Drög",
    inspecting: "Í vinnslu",
    completed: "Lokið",
    generating: "Skýrsla í gerð",
    rendering_pdf: "PDF í gerð",
    report_ready: "Skýrsla tilbúin",
    error: "Villa í skýrslugerð",
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
    loadError: "Ekki tókst að sækja skoðanir.",
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
    driveFailed: "Ekki tókst að senda skýrsluna í Google Drive. Reyndu aftur.",
    // Endurgerð skýrslu (alltaf staðfest fyrst): keyrir AI aftur og yfirskrifar handvirkan texta.
    regenerateTitle: "Endurgera skýrsluna?",
    regenerateBody:
      "AI skrifar skýrsluna upp á nýtt og skrifar yfir texta sem þú hefur breytt handvirkt. Til að laga orðalag án þess að keyra AI aftur skaltu nota „Breyta texta“.",
    regenerateCredit: "Eftir áskriftinni þinni getur endurgerðin notað eina skýrsluinneign.",
    regenerateConfirm: "Endurgera skýrslu",
    extraCreditTitle: "Nota eina skýrsluinneign?",
    extraCreditBody:
      "Innifaldar AI-endurgerðir fyrir þessa skýrslu eru búnar. Ný keyrsla notar eina skýrsluinneign af inneigninni þinni og skrifar yfir texta sem þú hefur breytt handvirkt.",
    extraCreditConfirm: "Nota inneign og endurgera",
    cancel: "Hætta við",
    pdfMissing:
      "Engin PDF-skrá er til fyrir þessa skýrslu ennþá. Opnaðu „Breyta texta“ og veldu „Vista og endurgera PDF“.",
    pdfError: "PDF-gerð mistókst. Opnaðu „Breyta texta“ og reyndu að endurgera PDF.",
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
    titleRequired: "Sláðu inn titil athugasemdar.",
    saveFailed: "Ekki tókst að vista athugasemdina. Reyndu aftur.",
    unsaved: "Óvistaðar breytingar",
    inspectionLabel: "Skoðun",
    reportNotice:
      "Þessi skoðun er þegar með skýrslu. Breytingar hér breyta ekki texta skýrslunnar sem er til.",
    reportNoticeLink: "Breyta skýrslutexta",
    metaTitle: "{title} — {address}",
  },
  photos: {
    loading: "Hleð...",
    thermal: "Hiti",
    loadingPhoto: "Hleð mynd...",
    unavailable: "Mynd ekki tiltæk",
    photoAlt: "Mynd {n} af {total}",
    openPhoto: "Opna mynd {n} af {total}",
    viewer: "Myndaskoðari",
    close: "Loka mynd",
    previous: "Fyrri mynd",
    next: "Næsta mynd",
  },
  reportEditor: {
    title: "Breyta skýrslutexta",
    metaTitle: "Breyta texta — {address}",
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
    unsaved: "Óvistaðar breytingar",
    saving: "Vista…",
    descriptionOf: "{label} — Lýsing",
    suggestionOf: "{label} — Tillaga",
    emptySuggestion: "(engin tillaga — birtist ekki í skýrslu)",
    saveAndRegenerate: "Vista og endurgera PDF",
    saveWithoutPdf: "Vista án PDF",
    viewReport: "Skoða skýrslu",
    savedNoPdf: "Breytingar vistaðar. PDF-ið uppfærist ekki fyrr en það er endurgert.",
    savedWhileRendering:
      "Vistað — en PDF-gerð var þegar í gangi með eldri texta. Ýttu aftur á „Vista og endurgera PDF“ eftir ~1 mínútu svo breytingarnar skili sér í PDF-ið.",
    saveUnconfirmed: "Ekki tókst að staðfesta vistun. Athugaðu tenginguna og reyndu aftur.",
    // NZS 4306-skýrslur (aðeins þegar skýrslan er á því sniði).
    nzHeading: "NZS 4306",
    nzSignificant: "Samantekt verulegra galla",
    nzSignificantHint: "Taflan yfir verulega galla er alltaf byggð á athugasemdunum sjálfum.",
    nzMaintenance: "Samantekt viðhalds (gradual deterioration and maintenance)",
    nzLimitations: "Takmarkanir og svæði sem ekki voru skoðuð",
    nzLimitationsHint: "Birtast orðrétt í skýrslunni.",
    nzMoisture: "Rakamælingar",
    nzMoistureHint: "Mælingar koma aðeins úr athugasemdum þínum. Hægt er að fjarlægja línu en ekki bæta við eða breyta.",
    nzRemoveRow: "Fjarlægja",
    nzRestoreRow: "Setja aftur",
    nzNoMoisture: "Engar rakamælingar.",
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
    qualificationsIsop: "Leyfi og réttindi (prentast á forsíðu skýrslunnar)",
    qualificationsIsopPlaceholder: "t.d. TREC #12345, InterNACHI member",
    qualificationsIsopHint: "Birtist á forsíðu Home inspection-skýrslna (US/Kanada).",
    logo: "Merki",
    logoAlt: "Merki",
    noLogo: "Ekkert merki",
    logoHint:
      "PNG, JPG, WebP eða SVG, mest 2 MB. Best er merki með gegnsæjum bakgrunni, a.m.k. 600 px á breidd.",
    removeLogo: "Fjarlægja merki",
    clearLogoSelection: "Hætta við val",
    saving: "Vista…",
    save: "Vista",
    saved: "Vistað. Nýjar skýrslur nota þessar upplýsingar.",
    logoTooLarge: "Merkið má mest vera 2 MB.",
    logoBadType: "Veldu PNG-, JPG-, WebP- eða SVG-mynd.",
    termsUrlInvalid: "Sláðu inn gilda vefslóð, t.d. https://fyrirtaeki.is/skilmalar.",
    uploadFailed: "Ekki tókst að hlaða merkinu upp. Reyndu aftur.",
    saveFailed: "Ekki tókst að vista. Reyndu aftur.",
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
    observationUpdateFailed: "Ekki tókst að uppfæra athugasemd í skýrslunni. Reyndu aftur.",
    queueFailed: "Textinn vistaðist en ekki tókst að setja PDF í biðröð. Reyndu aftur.",
    noAiReport: "Engin skýrsla til — búðu fyrst til skýrslu með AI.",
    textChangedElsewhere:
      "Skýrslutextinn hefur breyst síðan ritillinn var opnaður (t.d. ný skýrslugerð eða vistun annars staðar). Endurhladdu síðuna og gerðu breytingarnar aftur.",
    reportUpdateFailed: "Ekki tókst að vista skýrslutextann. Reyndu aftur.",
    signInAgain: "Skráðu þig inn aftur til að sjá stöðu skýrslunnar.",
    statusFetchFailed: "Tókst ekki að sækja stöðu skýrslunnar.",
    inspectionGone: "Skoðunin fannst ekki eða aðgangur er ekki lengur til staðar.",
    reportFailed: "Skýrslugerð mistókst. Opnaðu skoðunina til að reyna aftur.",
    noPdfForStatus:
      "Engin tilbúin PDF-skrá fannst fyrir núverandi stöðu. Opnaðu skoðunina til að athuga hana.",
    driveBetonOnly: "Google Drive er aðeins í boði fyrir Beton.",
    noReportForDrive: "Engin skýrsla til. Búðu til skýrslu fyrst.",
    reportDownloadFailed: "Ekki tókst að sækja skýrsluna. Reyndu aftur.",
    driveFailed: "Ekki tókst að senda skýrsluna í Google Drive. Reyndu aftur.",
    invalidSeverity: "Ógilt gildi á alvarleika.",
  },
  // Höfnun skýrsluinneignar (error_code frá edge-fallinu generate-report).
  credits: {
    ledger_unavailable: "Ekki tókst að staðfesta skýrsluinneign. Reyndu aftur eftir smástund.",
    no_credits:
      "AI-skýrslurnar eru búnar. Áskriftir og skýrslupakkar eru keyptir í Rondva-appinu fyrir iPhone. Handvirkar breytingar og endurútflutningur eru áfram ókeypis.",
    additional_credit_confirmation_required:
      "Innifaldar AI-endurgerðir fyrir þessa skýrslu eru búnar. Þú getur áfram breytt textanum og flutt skýrsluna út.",
    in_progress: "Verið er að búa til skýrslu fyrir þessa skoðun.",
    not_active: "Fyrirtækjaaðgangurinn er ekki virkur.",
    // Prufutími (áður kynningartilboð D3): dagsöryggi allra fyrirtækja náð — ekkert gjaldfært.
    offer_daily_limit: "Ókeypis prufuskýrslur eru takmarkaðar í dag — reyndu aftur á morgun.",
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
    countryHint: "Ræður heimilisfangssniði, skyldureitum og skýrslusniði. Þú getur breytt þessu síðar í Stillingum.",
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
    backToInspections: "← Back to inspections",
    loading: "Loading…",
    unsavedLeave: "You have unsaved changes. Leave without saving?",
  },
  errorPage: {
    title: "Something went wrong",
    body: "This page couldn't be loaded. Try again, and if that doesn't help, go back to your inspections.",
    retry: "Try again",
    reference: "Reference: {digest}",
  },
  notFoundPage: {
    title: "Page not found",
    body: "This page doesn't exist, or you don't have access to it.",
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
    standardIsop: "Home inspection (US/Canada, system order)",
    isopHint: "A system-ordered report for the US and Canada (in English). Applies to new reports.",
    schemeIsop: "System-order terms (US/Canada)",
    isopUnavailable: "This report format isn't available yet. Nothing was changed.",
    texasNotice: "Texas requires the TREC REI 7-6 form; Rondva doesn't produce it.",
    saving: "Saving…",
    saved: "Saved. Applies to new reports.",
    saveFailed: "Could not save the report settings. Please try again.",
  },
  // Company country (settings, owner only, app.rondva.com only).
  companyCountry: {
    label: "Company country",
    hint: "Sets the address format, required fields and report format for new inspections. Inspections you already started keep everything you entered.",
    confirmTitle: "Change country to {country}?",
    confirmBody:
      "New inspections use the address format, required fields and report wording for {country}. Inspections you already started keep everything you entered.",
    clearedNzs: "Your report format goes back to Standard, because NZS 4306:2005 is for New Zealand.",
    clearedIsop: "Your report format goes back to Standard, because Home inspection is for the US and Canada.",
    confirm: "Change country",
    cancel: "Cancel",
    saving: "Saving…",
    saved: "Country changed to {country}.",
    notOwner: "Only the company owner can change the country.",
    notAllowed: "This country isn't available for your company. Nothing was changed.",
    unavailable: "Changing the country isn't available yet. Nothing was changed.",
    failed: "Could not change the country. Nothing was changed — please try again.",
  },
  status: {
    draft: "Draft",
    inspecting: "In inspection",
    completed: "Completed",
    generating: "Creating report",
    rendering_pdf: "Rendering PDF",
    report_ready: "Report ready",
    error: "Report error",
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
    loadError: "Could not load inspections.",
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
    driveFailed: "Could not send the report to Google Drive. Please try again.",
    regenerateTitle: "Regenerate the report?",
    regenerateBody:
      "The AI writes the report again and replaces any text you edited by hand. To fix wording without running the AI again, use “Edit text”.",
    regenerateCredit: "Depending on your plan, regenerating may use one report credit.",
    regenerateConfirm: "Regenerate report",
    extraCreditTitle: "Use one report credit?",
    extraCreditBody:
      "The included AI revisions for this report are used up. Running it again uses one report credit from your balance and replaces any text you edited by hand.",
    extraCreditConfirm: "Use a credit and regenerate",
    cancel: "Cancel",
    pdfMissing:
      "This report doesn't have a PDF file yet. Open “Edit text” and choose “Save and regenerate PDF”.",
    pdfError: "The PDF could not be created. Open “Edit text” and try regenerating the PDF.",
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
    titleRequired: "Enter a title for the observation.",
    saveFailed: "Could not save the observation. Please try again.",
    unsaved: "Unsaved changes",
    inspectionLabel: "Inspection",
    reportNotice:
      "This inspection already has a report. Changes here don't change the text of the existing report.",
    reportNoticeLink: "Edit report text",
    metaTitle: "{title} — {address}",
  },
  photos: {
    loading: "Loading…",
    thermal: "Thermal",
    loadingPhoto: "Loading photo…",
    unavailable: "Photo unavailable",
    photoAlt: "Photo {n} of {total}",
    openPhoto: "Open photo {n} of {total}",
    viewer: "Photo viewer",
    close: "Close photo",
    previous: "Previous photo",
    next: "Next photo",
  },
  reportEditor: {
    title: "Edit report text",
    metaTitle: "Edit text — {address}",
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
    unsaved: "Unsaved changes",
    saving: "Saving…",
    descriptionOf: "{label} — Description",
    suggestionOf: "{label} — Suggestion",
    emptySuggestion: "(no suggestion — left out of the report)",
    saveAndRegenerate: "Save and regenerate PDF",
    saveWithoutPdf: "Save without PDF",
    viewReport: "View report",
    savedNoPdf: "Changes saved. The PDF won't update until it's regenerated.",
    savedWhileRendering:
      "Saved — but a PDF was already being generated from the older text. Press “Save and regenerate PDF” again in about a minute so your changes reach the PDF.",
    saveUnconfirmed: "Could not confirm the save. Check your connection and try again.",
    nzHeading: "NZS 4306",
    nzSignificant: "Significant defects summary",
    nzSignificantHint: "The table of significant defects is always built from the observations themselves.",
    nzMaintenance: "Gradual deterioration and maintenance summary",
    nzLimitations: "Limitations and areas not inspected",
    nzLimitationsHint: "Shown word for word in the report.",
    nzMoisture: "Moisture readings",
    nzMoistureHint: "Readings come only from your notes. You can remove a row, but not add or change one.",
    nzRemoveRow: "Remove",
    nzRestoreRow: "Restore",
    nzNoMoisture: "No moisture readings.",
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
    qualificationsIsop: "Licence and qualifications (printed on the report cover)",
    qualificationsIsopPlaceholder: "e.g. TREC #12345, InterNACHI member",
    qualificationsIsopHint: "Shown on the cover of Home inspection reports (US/Canada).",
    logo: "Logo",
    logoAlt: "Logo",
    noLogo: "No logo",
    logoHint:
      "PNG, JPG, WebP or SVG, max 2 MB. A logo with a transparent background, at least 600 px wide, works best.",
    removeLogo: "Remove logo",
    clearLogoSelection: "Clear selection",
    saving: "Saving…",
    save: "Save",
    saved: "Saved. New reports will use this information.",
    logoTooLarge: "The logo must be at most 2 MB.",
    logoBadType: "Choose a PNG, JPG, WebP or SVG image.",
    termsUrlInvalid: "Enter a valid web address, for example https://example.com/terms.",
    uploadFailed: "The logo could not be uploaded. Please try again.",
    saveFailed: "Could not save. Please try again.",
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
    observationUpdateFailed: "Could not update an observation in the report. Please try again.",
    queueFailed: "The text was saved but the PDF could not be queued. Please try again.",
    noAiReport: "There's no report yet — create one with AI first.",
    textChangedElsewhere:
      "The report text has changed since the editor was opened (for example a new report run or a save elsewhere). Reload the page and make your changes again.",
    reportUpdateFailed: "Could not save the report text. Please try again.",
    signInAgain: "Sign in again to see the report status.",
    statusFetchFailed: "Could not fetch the report status.",
    inspectionGone: "The inspection wasn't found, or you no longer have access to it.",
    reportFailed: "Report generation failed. Open the inspection to try again.",
    noPdfForStatus: "No finished PDF was found for the current status. Open the inspection to check it.",
    driveBetonOnly: "Google Drive is only available for Beton.",
    noReportForDrive: "There's no report yet. Create a report first.",
    reportDownloadFailed: "Could not fetch the report. Please try again.",
    driveFailed: "Could not send the report to Google Drive. Please try again.",
    invalidSeverity: "Invalid severity value.",
  },
  credits: {
    ledger_unavailable: "We couldn't check your report credits. Please try again in a moment.",
    no_credits:
      "You're out of AI reports. Plans and report packs are bought in the Rondva iPhone app. Manual edits and re-exports stay free.",
    additional_credit_confirmation_required:
      "The included AI revisions for this report are used up. You can still edit the text and export the report.",
    in_progress: "An AI report is already being generated for this inspection.",
    not_active: "Your company account isn't active, so AI drafting isn't available.",
    offer_daily_limit: "Free trial reports are limited today — please try again tomorrow.",
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
    countryHint: "Sets the address format, required fields and report format. You can change it later in Settings.",
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
