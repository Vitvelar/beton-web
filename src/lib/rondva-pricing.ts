// Verð og tilboð Rondva — ein heimild fyrir kynningarsíðuna og /support, svo tölurnar
// geta aldrei rekist á. Eigandinn samþykkti áætlanirnar 2026-10-07. Verðin eru í
// USD; kaup fara fram í iPhone-appinu í gegnum App Store (Apple sýnir verð í
// staðbundinni mynt með sköttum). Appið er á App Store; ekkert af þessu er til sölu á vefnum. `node scripts/verify-rondva-pricing.cjs` ber þetta
// saman við textann á síðunum.
//
// Ekki nefna Ísland í texta prufumánaðarins: íslensk fyrirtæki eru aðeins í boði eftir
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
 * Fyrsti mánuður frír (ákvörðun eiganda 2026-10-08; kom í stað stofnmannatilboðsins „20 á
 * mánuði til 31. janúar 2027“): hvert nýtt fyrirtæki fær EINU SINNI `freeReports` AI-drög sem
 * gilda í `days` daga frá FYRSTU AI-skýrslu fyrirtækisins (ekki frá skráningu eða virkjun; PRUFUTIMI-HONNUN §2a, `starts_on = 'first_ai_report'`), hvort sem fyrr kemur. Ekkert
 * kort, engin sjálfvirk greiðsla á eftir. Sama regla í gagnagrunni: beton-app
 * supabase/migrations/20261008150000_report_trial_month.sql (report_trial_policy 20 / 30).
 */
export const RONDVA_TRIAL = {
  freeReports: 20,
  days: 30,
} as const;

/**
 * EIN tilboðslína fyrir hero, stjórnborð, /nz, llms.txt og skema; smíðuð úr RONDVA_TRIAL svo
 * talan sé aðeins á einum stað. /support, /terms og prufuspjald forsíðunnar nota sömu fasta.
 */
export const RONDVA_OFFER_LINE = `First month free — ${RONDVA_TRIAL.freeReports} AI-drafted reports in your first month. No card.`;

export const RONDVA_PRICE_NOTE =
  "Charged by Apple in your currency incl. GST/VAT. Solo is NZ$99.99 in New Zealand, A$79.99 in Australia and EUR 59.99 in Ireland.";

/**
 * NZ-verð á /nz. Aðeins Solo er staðfest í App Store Connect (NZ$99.99); Pro og Report pack eru
 * EKKI gefin upp í NZ$ fyrr en þau eru lesin úr ASC — ekki giska. Verð á skýrslu er reiknað.
 */
export const RONDVA_NZ_SOLO = { price: "99.99", currency: "NZ$" } as const;

export function nzSoloPerReport(): string {
  const solo = RONDVA_PLANS.find((p) => p.id === "solo");
  return solo ? (Number(RONDVA_NZ_SOLO.price) / solo.reports).toFixed(2) : "";
}

/** Verð á vefnum eru í USD og merkt „US$“ svo NZ/AU-gestur lesi þau ekki sem eigin dollara. */
export function usd(price: string): string {
  return `US$${price}`;
}
