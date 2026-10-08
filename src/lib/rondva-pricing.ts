// Verð og tilboð Rondva — ein heimild fyrir kynningarsíðuna og /support, svo tölurnar
// geta aldrei rekist á. Eigandinn samþykkti áætlanirnar 2026-10-07. Verðin eru í
// USD; kaup fara fram í iPhone-appinu í gegnum App Store (Apple sýnir verð í
// staðbundinni mynt með sköttum). Appið er „coming to the App Store“ — ekkert af
// þessu er til sölu á vefnum. `node scripts/verify-rondva-pricing.cjs` ber þetta
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
    blurb: "For a busy practice or a small team.",
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
 * gilda í `days` daga frá því fyrirtækjaaðgangurinn er virkjaður, hvort sem fyrr kemur. Ekkert
 * kort, engin sjálfvirk greiðsla á eftir. Sama regla í gagnagrunni: beton-app
 * supabase/migrations/20261008150000_report_trial_month.sql (report_trial_policy 20 / 30).
 */
export const RONDVA_TRIAL = {
  freeReports: 20,
  days: 30,
} as const;

export const RONDVA_PRICE_NOTE =
  "Prices in USD; your App Store shows your local price incl. tax.";

export function usd(price: string): string {
  return `$${price}`;
}
