import type { Metadata } from "next";
import { BRANDS } from "@/lib/brand";
import { isopEnabled } from "@/lib/report/isop";
import { HAS_SAMPLE, SAMPLE_REPORT_URL } from "@/lib/rondva-links";
import { RONDVA_OFFER_LINE, RONDVA_PACK, RONDVA_PLANS } from "@/lib/rondva-pricing";

// Landasíður rondva.com/au, /uk, /ie, /us og /ca (sama mynstur og /nz): gögn hér, útlit í
// src/components/rondva/CountryPage.tsx. Verð eru App Store-verð í mynt landsins (eigandi
// staðfesti 2026-10-24); skýrslufjöldi kemur úr rondva-pricing.ts. Texti á að vera sannur:
// aðeins það sem skýrslusmiðurinn raunverulega prentar, engin „compliant/certified“, engin
// nöfn fagfélaga sem Rondva uppfyllir, engin verð á skýrslu. `node scripts/verify-rondva-pricing.cjs`
// ber þetta saman við kóðann.

const SITE = BRANDS.rondva.marketingUrl;

export type CountryCode = "nz" | "au" | "uk" | "ie" | "us" | "ca";

/** Öll sex lönd: hreflang, fótur og sitemap lesa héðan. NZ-síðan sjálf er áfram í nz/page.tsx. */
export const COUNTRY_LINKS: readonly {
  code: CountryCode;
  name: string;
  path: string;
  hreflang: string;
  ogLocale: string;
}[] = [
  { code: "nz", name: "New Zealand", path: "/nz", hreflang: "en-NZ", ogLocale: "en_NZ" },
  { code: "au", name: "Australia", path: "/au", hreflang: "en-AU", ogLocale: "en_AU" },
  { code: "uk", name: "United Kingdom", path: "/uk", hreflang: "en-GB", ogLocale: "en_GB" },
  { code: "ie", name: "Ireland", path: "/ie", hreflang: "en-IE", ogLocale: "en_IE" },
  { code: "us", name: "United States", path: "/us", hreflang: "en-US", ogLocale: "en_US" },
  { code: "ca", name: "Canada", path: "/ca", hreflang: "en-CA", ogLocale: "en_CA" },
];

/** hreflang fyrir forsíðu og landasíður (ekki /support, /privacy o.s.frv.): einn smiður. */
export function rondvaLanguages(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const c of COUNTRY_LINKS) out[c.hreflang] = `${SITE}${c.path}`;
  out["x-default"] = SITE;
  return out;
}

// Sýnisskýrslur: hver er á bak við sinn rofa (false þar til PDF-skráin er komin í public/rondva/).
// true ⇒ skráin verður að vera til, false ⇒ hún má ekki vera til (verify-rondva-pricing.cjs).
// NZ fylgir HAS_SAMPLE í rondva-links.ts.
export type SampleReport = { url: string; enabled: boolean };
export const SAMPLE_REPORTS: Record<CountryCode, SampleReport | null> = {
  nz: { url: SAMPLE_REPORT_URL, enabled: HAS_SAMPLE },
  au: { url: "/sample-report-au.pdf", enabled: true },
  uk: { url: "/sample-condition-ratings.pdf", enabled: false },
  ie: { url: "/sample-condition-ratings.pdf", enabled: false },
  us: null,
  ca: null,
};

export type CountryFaq = { id: string; q: string; a: string };
export type CountryItem = { title: string; body: string };

export type Country = {
  code: Exclude<CountryCode, "nz">;
  name: string;
  /** „in Australia“ / „in the United Kingdom“ í spurningum. */
  inName: string;
  path: string;
  hreflang: string;
  ogLocale: string;
  /** Tákn gjaldmiðils eins og App Store sýnir það: A$, £, €, US$, CA$. */
  currency: string;
  currencyName: string;
  prices: { solo: string; pro: string; pack: string };
  /** Skattur á verðunum: innifalinn (GST/VAT) eða bættur við af Apple. */
  taxLine: string;
  title: string;
  description: string;
  eyebrow: string;
  h1: { before: string; em: string };
  /** Fyrsta málsgrein: svarar spurningunni (skilgreining). */
  lead: string;
  /** Önnur málsgrein: hvernig skýrslan lítur út og hvað hún er ekki. */
  formatLine: string;
  format: { heading: string; items: CountryItem[]; note: string };
  /** Skjámynd aðeins ef hún er sönn fyrir landið (ekki NZ-orð eða NZ-svæði). */
  screen?: { src: string; alt: string; aspect: string; caption: string };
  offline: { heading: string; body: string };
  faq: CountryFaq[];
  sample: SampleReport | null;
  /** Ein lína í llms.txt: verð og snið, aðeins staðreyndir. */
  llms: string;
};

export const money = (c: Pick<Country, "currency" | "prices">, key: "solo" | "pro" | "pack") =>
  `${c.currency}${c.prices[key]}`;

const solo = RONDVA_PLANS.find((p) => p.id === "solo");
const pro = RONDVA_PLANS.find((p) => p.id === "pro");
const soloReports = solo?.reports ?? 0;
const proReports = pro?.reports ?? 0;

// ── Sameiginleg ensk skýrsla (AU, UK, IE): aðeins það sem report/page.tsx prentar ──────────────
// (sannreynt 2026-10-24: kápa, efnisyfirlit, inngangur + matskerfi, samantekt, kafli á rými,
// verkefnalisti (10 alvarlegustu), takmarkanir + eigin skilmálar). Ekkert AI-yfirlýsingablað er í þessari
// skýrslu (það er aðeins í NZS 4306-sniðinu), svo það er ekki fullyrt hér.
function generalReportItems(ratingItem: CountryItem, ratingWords: string): CountryItem[] {
  return [
    ratingItem,
    {
      title: "Cover and summary",
      body: `Your company logo and name, the address, a cover photo, the client and the inspection date. Then an introduction and conclusion, a count of your findings by the rating you set (${ratingWords}) and the property and inspection details.`,
    },
    {
      title: "Findings, room by room",
      body: "A section for each room or area you inspected, with your photos, your rating for each item, your notes, and each finding with its rating, description, recommendation and photos.",
    },
    {
      title: "Action list",
      body: "Up to ten of your most serious findings in one list, from the most serious down, with the recommendation for each.",
    },
    {
      title: "Limitations and terms",
      body: "The general limitations of a visual inspection, then your own terms and conditions or a link to them.",
    },
  ];
}

const GENERAL_NOTE =
  "Your company logo goes on the cover and the last page. A Rondva report is your professional inspection, written up; you are responsible for its content before you issue it.";

const AU_RATING_ITEM: CountryItem = {
  title: "Minor, Serious and Very serious",
  body: "You rate every finding. Minor is damage that does not affect how the building element or the building functions. Serious is damage that impairs the function of the element in the longer term. Very serious is damage that has already impaired it, or will soon.",
};

// Aðeins athugasemdaskjárinn: Minor/Serious/Very serious eru orðin í almennu skýrslunni (AU og US/CA
// meðan isop er ekki í boði). Rýmisskjárinn (offline-nz) sýnir NZ-svæði og er því ekki notaður.
const GENERAL_SCREEN: NonNullable<Country["screen"]> = {
  src: "/rondva/screens/observation-nz.webp",
  alt: "Rondva observation screen: the severity you choose (Minor, Serious or Very serious, with Very serious selected), category, title, a description, a recommendation, and photos including a thermal image",
  aspect: "!aspect-[997/2010]",
  caption: "You set the severity, the AI never does.",
};

const CONDITION_RATING_ITEM: CountryItem = {
  title: "Condition ratings 1, 2 and 3",
  body: "You rate every finding. Rating 1: no repair is needed at present. Rating 2: a defect that needs repairing or replacing, but is not serious or urgent. Rating 3: a serious defect, or one that needs urgent attention.",
};

// ── US og CA: `isop`-sniðið ──────────────────────────────────────────────────────────────────
// ATH: Allur US/CA-sniðstextinn er í þessum eina hlut og lýsir `isop`-skýrslusniðinu
// (plan/rondva/ISOP-SNID-HONNUN.md §1–§2; vefur: src/lib/report/isop.ts). Hann birtist AÐEINS þegar
// isopEnabled() er satt við bygginguna (sjá ISOP_ON hér neðar) og þá sem val í stillingum
// („Home inspection“), aldrei sem sjálfgefið. Engin staðalnöfn (InterNACHI, ASHI, TREC, CSA) og
// engin „compliant“.
export const ISOP_SYSTEMS = [
  "Roof",
  "Exterior",
  "Basement, Foundation, Crawlspace & Structure",
  "Heating",
  "Cooling",
  "Plumbing",
  "Electrical",
  "Fireplace",
  "Attic, Insulation & Ventilation",
  "Doors, Windows & Interior",
] as const;

export const ISOP_COPY = {
  systems: ISOP_SYSTEMS,
  lead: "Rondva is an iPhone app that drafts home inspection reports from the inspector's photos, notes and ratings. Its Home inspection format organizes the findings by system: roof, exterior, structure, heating, cooling, plumbing, electrical and more. The inspector reviews and issues the report under their own company name.",
  formatLine:
    "Choose the Home inspection format in Settings and the report has ten systems in a fixed order, a status for each system, and a summary of deficiencies at the front, built from your ratings.",
  notReplace: {
    us: "It does not replace any state-required form.",
    ca: "It does not replace any form your province requires.",
  },
  caEnglish: "Reports are in English only.",
  items: [
    {
      title: "Summary of deficiencies",
      body: "A table at the front of every finding you rated Repair or replace or Major defect. It is built from your ratings, not written by the AI.",
    },
    {
      title: "Ten systems, in a fixed order",
      body: `${ISOP_SYSTEMS.join("; ")}. Anything that does not fit goes under Additional items.`,
    },
    {
      title: "A status for each system",
      body: "Inspected, Not inspected with your reason, or Not present. You set the status; the AI never does.",
    },
    {
      title: "Findings, with your ratings",
      body: "Under each system, your findings with photos, the rating you set (Maintenance, Repair or replace, or Major defect) and a recommendation for each.",
    },
    {
      title: "Limitations and items not inspected",
      body: "Every system you marked Not inspected, with your reason, and your own general limitations, printed as you wrote them.",
    },
    {
      title: "Use of AI in this report",
      body: "A fixed statement that the report text was drafted with AI assistance, with your name and your company's.",
    },
  ] as CountryItem[],
  formatHeading: "What goes into the report, system by system.",
  note: "Your company logo and your own terms go in the report. A Rondva report is your professional inspection, written up; you are responsible for its content before you issue it.",
  formatFaq: {
    q: "What does the report look like?",
    a: "If you choose the Home inspection format in Settings, it has ten systems in a fixed order, a status for each system (Inspected, Not inspected with your reason, or Not present), and a summary of deficiencies at the front, built from your ratings without AI. Findings are then rated Maintenance, Repair or replace, or Major defect.",
  },
  llms: "the Home inspection format, chosen in Settings, has ten systems in a fixed order with a status for each and a summary of deficiencies built from the inspector's ratings, and findings rated Maintenance, Repair or replace, or Major defect",
};

// US og CA velja sniðtexta við BYGGINGU úr isopEnabled() (ISOP_ENABLED=1 á þjóninum): síðurnar eru
// kyrrstæðar, svo breyting á umhverfisbreytunni krefst nýrrar útgáfu (redeploy) til að texti síðunnar
// breytist. Sjálfgefið (óvirkt, eins og í framleiðslu í dag) fær US/CA almennu ensku skýrsluna,
// alveg eins og stillingar fyrirtækisins gefa (settings.ts: US/CA → standard "default"); `isop`-textinn
// í ISOP_COPY birtist aðeins þegar valkosturinn er í boði og þá sem VAL í stillingum.
const ISOP_ON = isopEnabled();

type Region = "us" | "ca";

function usCaFormat(region: Region) {
  const notReplace = region === "us" ? ISOP_COPY.notReplace.us : ISOP_COPY.notReplace.ca;
  const dialect = region === "us" ? "American English" : "Canadian English";
  const englishOnly = region === "ca" ? ` ${ISOP_COPY.caEnglish}` : "";
  if (ISOP_ON) {
    return {
      lead: ISOP_COPY.lead,
      formatLine: `${ISOP_COPY.formatLine} ${notReplace}${englishOnly}`,
      format: {
        heading: ISOP_COPY.formatHeading,
        items: ISOP_COPY.items,
        note: `${ISOP_COPY.note} ${notReplace}${englishOnly}`,
      },
      formatFaq: ISOP_COPY.formatFaq,
      llms: `${ISOP_COPY.llms}; ${region === "us" ? "does not replace any state-required form" : "English only; does not replace any provincial form"}`,
      screen: undefined,
    };
  }
  const formatLine = `The report is Rondva's general English report, in ${dialect}, with findings rated Minor, Serious or Very serious. ${notReplace}${englishOnly}`;
  return {
    lead: "Rondva is an iPhone app that drafts home inspection reports from the inspector's photos, notes and ratings. The inspector reviews and issues the report under their own company name.",
    formatLine,
    format: {
      heading: "What goes into the report, section by section.",
      items: generalReportItems(AU_RATING_ITEM, "Minor, Serious and Very serious"),
      note: `${GENERAL_NOTE} ${notReplace}${englishOnly}`,
    },
    formatFaq: {
      q: "What does the report look like?",
      a: `It is Rondva's general English report, in ${dialect}: a cover, a summary, a section for each room or area, an action list and the limitations, with findings rated Minor, Serious or Very serious. ${notReplace}`,
    },
    llms: `general English report in ${dialect} with findings rated Minor, Serious or Very serious; ${region === "us" ? "does not replace any state-required form" : "English only; does not replace any provincial form"}`,
    screen: GENERAL_SCREEN,
  };
}

// ── Hjálparföll fyrir texta sem er sameiginlegur ─────────────────────────────────────────────
const OFFLINE_BODY =
  "Everything is saved on your phone as you go and syncs when you are back online. Record the rooms and areas you walk, your ratings, photos, thermal images and a note for every finding. Creating the AI draft is the one step that needs a connection.";

const OFFLINE_ANSWER =
  "Yes. Everything you record is saved on your phone as you go, so you can keep inspecting with no signal. It syncs when you are back online.";

const RESPONSIBLE_ANSWER =
  "You are. Rondva drafts the report text from your photos, notes and ratings, you review every word, and you issue the PDF under your company name.";

function priceAnswer(c: Pick<Country, "currency" | "prices" | "taxLine">): string {
  return `Solo is ${money(c, "solo")} a month for ${soloReports} AI-drafted reports, Pro is ${money(c, "pro")} a month for ${proReports}, and the ${RONDVA_PACK.name} is ${money(c, "pack")} one-time for ${RONDVA_PACK.reports} reports that never expire. Plans are cheaper per report. ${c.taxLine} Charged by Apple. ${RONDVA_OFFER_LINE}`;
}

type Seed = Omit<Country, "description" | "faq" | "sample" | "format" | "offline"> & {
  descriptionLead: string;
  format: Country["format"];
  offlineHeading: string;
  formatFaq: { q: string; a: string };
  ratingsFaq: string;
  extraFaq?: { id: string; q: string; a: string }[];
};

function build(seed: Seed): Country {
  const { descriptionLead, offlineHeading, formatFaq, ratingsFaq, extraFaq, ...rest } = seed;
  const base = { ...rest, offline: { heading: offlineHeading, body: OFFLINE_BODY } };
  return {
    ...base,
    description: `${descriptionLead} You review every word and the PDF goes out under your company name. Solo is ${money(seed, "solo")} a month. ${seed.taxLine}`,
    sample: SAMPLE_REPORTS[seed.code],
    faq: [
      { id: "what", q: "What is Rondva?", a: seed.lead },
      { id: "format", ...formatFaq },
      { id: "ratings", q: "Can the AI change my ratings?", a: ratingsFaq },
      ...(extraFaq ?? []),
      { id: "offline", q: "Does it work with no signal?", a: OFFLINE_ANSWER },
      { id: "responsible", q: "Who is responsible for the report?", a: RESPONSIBLE_ANSWER },
      { id: "price", q: `How much does Rondva cost ${seed.inName}?`, a: priceAnswer(seed) },
    ],
  };
}

const RATINGS_LOCKED = "No. Your ratings are locked: the AI cannot change the severity you set on any finding.";
const CONDITION_LOCKED = "No. Your ratings are locked: the AI cannot change the condition rating you set on any finding.";

const AU_FORMAT_LINE =
  "The report is Rondva's general English report, with findings rated Minor, Serious or Very serious. It is not set out in the AS 4349.1 format yet.";
const CONDITION_FORMAT_LINE =
  "The report is Rondva's general English report. You give every finding a condition rating of 1, 2 or 3: 1 means no repair is needed at present, 2 a defect that needs repairing but is not serious or urgent, and 3 a serious or urgent defect. Rondva is not affiliated with any professional body.";

const AFFILIATION_FAQ = {
  id: "affiliation",
  q: "Is Rondva affiliated with a professional body?",
  a: "No. Rondva is not affiliated with any professional body. It is a drafting tool: you set the ratings, review the text and issue the report under your own company name.",
};

export const AU = build({
  code: "au",
  name: "Australia",
  inName: "in Australia",
  path: "/au",
  hreflang: "en-AU",
  ogLocale: "en_AU",
  currency: "A$",
  currencyName: "Australian dollars",
  prices: { solo: "79.99", pro: "149.99", pack: "99.99" },
  taxLine: "Prices include GST.",
  title: "Building inspection reports for Australia, drafted on your iPhone | Rondva",
  descriptionLead:
    "Rondva is an iPhone app that drafts building inspection reports from your photos, notes and ratings, even with no signal on site.",
  eyebrow: "Australia · iPhone app on the App Store",
  h1: { before: "Building inspection reports, ", em: "drafted from your site notes." },
  lead: "Rondva is an iPhone app that drafts building inspection reports from the inspector's photos, notes and ratings. The inspector reviews and issues the report under their own company name.",
  formatLine: AU_FORMAT_LINE,
  format: {
    heading: "What goes into the report, section by section.",
    items: generalReportItems(AU_RATING_ITEM, "Minor, Serious and Very serious"),
    note: `${GENERAL_NOTE} It is not set out in the AS 4349.1 format yet.`,
  },
  // Athugasemdaskjárinn (GENERAL_SCREEN), sjá skýringu við hann.
  screen: GENERAL_SCREEN,
  offlineHeading: "Captures with no signal: under the house, in the roof space.",
  formatFaq: {
    q: "Does Rondva write AS 4349.1 reports?",
    a: `Not yet. The report is Rondva's general English report: a cover, a summary, a section for each room or area, an action list and the limitations, with findings rated Minor, Serious or Very serious. It is not set out in the AS 4349.1 format yet.`,
  },
  ratingsFaq: RATINGS_LOCKED,
  llms: "general English report with findings rated Minor, Serious or Very serious; not set out in the AS 4349.1 format yet",
});

export const UK = build({
  code: "uk",
  name: "United Kingdom",
  inName: "in the United Kingdom",
  path: "/uk",
  hreflang: "en-GB",
  ogLocale: "en_GB",
  currency: "£",
  currencyName: "pounds sterling",
  prices: { solo: "49.99", pro: "99.99", pack: "69.99" },
  taxLine: "Prices include VAT.",
  title: "Inspection reports with condition ratings 1, 2 and 3, drafted on your iPhone | Rondva",
  descriptionLead:
    "Rondva is an iPhone app that drafts building inspection reports with condition ratings 1, 2 and 3 from your photos, notes and ratings, even with no signal on site.",
  eyebrow: "United Kingdom · iPhone app on the App Store",
  h1: { before: "Inspection reports rated 1, 2 and 3, ", em: "drafted from your site notes." },
  lead: "Rondva is an iPhone app that drafts building inspection reports from the inspector's photos, notes and ratings, with each finding given a condition rating of 1, 2 or 3 by the inspector. The inspector reviews and issues the report under their own company name.",
  formatLine: CONDITION_FORMAT_LINE,
  format: {
    heading: "What goes into the report, section by section.",
    items: generalReportItems(CONDITION_RATING_ITEM, "condition ratings 1, 2 and 3"),
    note: GENERAL_NOTE,
  },
  offlineHeading: "Captures with no signal: in the loft, under the floor.",
  formatFaq: {
    q: "What does the report look like?",
    a: "It is Rondva's general English report: a cover, a summary, a section for each room or area, an action list and the limitations. Every finding carries a condition rating of 1, 2 or 3 that you set: 1 means no repair is needed at present, 2 a defect that needs repairing but is not serious or urgent, and 3 a serious or urgent defect.",
  },
  ratingsFaq: CONDITION_LOCKED,
  extraFaq: [AFFILIATION_FAQ],
  llms: "general English report with condition ratings 1, 2 and 3",
});

export const IE = build({
  code: "ie",
  name: "Ireland",
  inName: "in Ireland",
  path: "/ie",
  hreflang: "en-IE",
  ogLocale: "en_IE",
  currency: "€",
  currencyName: "euros",
  prices: { solo: "59.99", pro: "99.99", pack: "79.99" },
  taxLine: "Prices include VAT.",
  title: "Inspection reports with condition ratings 1, 2 and 3 for Ireland, drafted on your iPhone | Rondva",
  descriptionLead:
    "Rondva is an iPhone app that drafts building inspection reports with condition ratings 1, 2 and 3 from your photos, notes and ratings, even with no signal on site.",
  eyebrow: "Ireland · iPhone app on the App Store",
  h1: { before: "Inspection reports rated 1, 2 and 3, ", em: "drafted from your site notes." },
  lead: "Rondva is an iPhone app that drafts building inspection reports from the inspector's photos, notes and ratings, with each finding given a condition rating of 1, 2 or 3 by the inspector. The inspector reviews and issues the report under their own company name.",
  formatLine: CONDITION_FORMAT_LINE,
  format: {
    heading: "What goes into the report, section by section.",
    items: generalReportItems(CONDITION_RATING_ITEM, "condition ratings 1, 2 and 3"),
    note: GENERAL_NOTE,
  },
  offlineHeading: "Captures with no signal: in the attic, under the floor.",
  formatFaq: {
    q: "What does the report look like?",
    a: "It is Rondva's general English report: a cover, a summary, a section for each room or area, an action list and the limitations. Every finding carries a condition rating of 1, 2 or 3 that you set: 1 means no repair is needed at present, 2 a defect that needs repairing but is not serious or urgent, and 3 a serious or urgent defect.",
  },
  ratingsFaq: CONDITION_LOCKED,
  extraFaq: [AFFILIATION_FAQ],
  llms: "general English report with condition ratings 1, 2 and 3",
});

export const US = build({
  code: "us",
  name: "United States",
  inName: "in the United States",
  path: "/us",
  hreflang: "en-US",
  ogLocale: "en_US",
  currency: "US$",
  currencyName: "US dollars",
  prices: { solo: "49.99", pro: "99.99", pack: "69.99" },
  taxLine: "App Store prices in the US exclude sales tax; Apple adds sales tax where it applies.",
  title: "Home inspection reports, drafted on your iPhone | Rondva",
  descriptionLead:
    "Rondva is an iPhone app that drafts home inspection reports from your photos, notes and ratings, even with no signal on site.",
  eyebrow: "United States · iPhone app on the App Store",
  h1: { before: "Home inspection reports, ", em: "drafted from your site notes." },
  ...usCaFormat("us"),
  offlineHeading: "Captures with no signal: in the attic, in the crawlspace.",
  ratingsFaq: RATINGS_LOCKED,
  extraFaq: [
    {
      id: "forms",
      q: "Does it replace a state-required form?",
      a: "No. Rondva does not produce state-required forms and does not replace one. If your state requires a specific form, you still complete it.",
    },
  ],
});

export const CA = build({
  code: "ca",
  name: "Canada",
  inName: "in Canada",
  path: "/ca",
  hreflang: "en-CA",
  ogLocale: "en_CA",
  currency: "CA$",
  currencyName: "Canadian dollars",
  prices: { solo: "69.99", pro: "129.99", pack: "99.99" },
  taxLine: "Prices exclude tax; Apple adds GST/HST where it applies.",
  title: "Home inspection reports for Canada, drafted on your iPhone | Rondva",
  descriptionLead:
    "Rondva is an iPhone app that drafts home inspection reports from your photos, notes and ratings, even with no signal on site.",
  eyebrow: "Canada · iPhone app on the App Store",
  h1: { before: "Home inspection reports, ", em: "drafted from your site notes." },
  ...usCaFormat("ca"),
  offlineHeading: "Captures with no signal: in the attic, in the crawlspace.",
  ratingsFaq: RATINGS_LOCKED,
  extraFaq: [
    {
      id: "forms",
      q: "Does it replace a form my province requires?",
      a: "No. Rondva does not produce provincial forms and does not replace one. If your province requires a specific form, you still complete it. Reports are in English only.",
    },
  ],
});

export const COUNTRIES: readonly Country[] = [AU, UK, IE, US, CA];

/** Metadata fyrir landasíðu: eigin canonical, hreflang á öll sex löndin og og:locale. */
export function countryMetadata(c: Country): Metadata {
  const url = `${SITE}${c.path}`;
  return {
    title: { absolute: c.title },
    description: c.description,
    alternates: { canonical: url, languages: rondvaLanguages() },
    openGraph: {
      title: c.title,
      description: c.description,
      type: "website",
      locale: c.ogLocale,
      siteName: "Rondva",
      url,
      images: [{ url: "/rondva/og-1200x630.png", width: 1200, height: 630, alt: "Rondva" }],
    },
    twitter: {
      card: "summary_large_image",
      title: c.title,
      description: c.description,
      images: ["/rondva/og-1200x630.png"],
    },
  };
}
