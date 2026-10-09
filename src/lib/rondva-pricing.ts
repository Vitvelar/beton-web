// Verð og tilboð Rondva — ein heimild fyrir kynningarsíðuna og /support, svo tölurnar
// geta aldrei rekist á. Eigandinn samþykkti áætlanirnar 2026-10-07. Verðin eru í
// USD; kaup fara fram í iPhone-appinu í gegnum App Store (Apple sýnir verð í
// staðbundinni mynt með sköttum). Appið er á App Store; ekkert af þessu er til sölu á vefnum. `node scripts/verify-rondva-pricing.cjs` ber þetta
// saman við textann á síðunum.
//
// Ekki nefna Ísland í texta tilboðsins: íslensk fyrirtæki eru aðeins í boði eftir
// boði, og tilboðið er sett fram almennt (sjá verify-skriftuna).

export type RondvaPlan = {
  id: "solo" | "pro";
  name: string;
  /** Verð á mánuði í USD, sem texti til að halda aurunum (49.99). */
  price: string;
  /** AI-drög á mánuði. */
  reports: number;
  blurb: string;
  recommended: boolean;
};

export const RONDVA_PLANS: readonly RondvaPlan[] = [
  {
    id: "solo",
    name: "Solo",
    price: "49.99",
    reports: 8,
    blurb: "For a steady flow of jobs.",
    recommended: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "99.99",
    reports: 30,
    blurb: "For a busy inspector — 30 AI reports a month.",
    recommended: true,
  },
];

export const RONDVA_PACK = {
  name: "Report pack",
  /** Einskiptiskaup í USD. */
  price: "29.99",
  reports: 10,
  blurb: "Additional reports when a month runs over.",
} as const;

/** Innifalið í öllum áætlunum. */
export const RONDVA_INCLUDED = [
  "2 AI revisions included with every report",
  "Unlimited manual editing and re-exports",
  "Your company branding on every report",
] as const;

/**
 * Stofnmannatilboðið (í gildi): ókeypis AI-drög á mánuði, án korts, til og með
 * `endsOn`. Þegar dagsetningin líður þarf að fjarlægja tilboðið af síðunum (sjá PR-lýsingu).
 */
export const RONDVA_OFFER = {
  freeReportsPerMonth: 20,
  endsOn: "31 January 2027",
} as const;

/**
 * Prufan sem tekur við af stofnmannatilboðinu (beton-app #46/#48 + beton-web #37). Ekki lifandi
 * fyrr en flutningurinn er keyrður; fastinn er hér svo allt sem vísar í hana lesi eina tölu.
 */
export const RONDVA_TRIAL = {
  freeReports: 20,
  days: 30,
} as const;

/**
 * EIN tilboðslína fyrir hero, stjórnborð og aðra fleti.
 * Þar til prufan er lifandi: „Your first reports are free. No card.“
 * VIÐ MERGE EFTIR FLUTNING skal skipta í:
 *   „First 30 days free, up to 20 reports. No card. Nothing renews on its own.“
 * (smíðað úr RONDVA_TRIAL) og samræma /support, /terms og stofnmannaspjaldið á forsíðunni.
 */
export const RONDVA_OFFER_LINE = "Your first reports are free. No card.";

export const RONDVA_PRICE_NOTE =
  "Charged by Apple in your currency incl. GST/VAT. Solo is NZ$99.99 in New Zealand, A$79.99 in Australia and EUR 59.99 in Ireland.";

/** Verð á vefnum eru í USD og merkt „US$“ svo NZ/AU-gestur lesi þau ekki sem eigin dollara. */
export function usd(price: string): string {
  return `US$${price}`;
}
