import { BRANDS } from "@/lib/brand";
import { APP_STORE_URL } from "@/lib/rondva-links";
import { RONDVA_NZ_SOLO, RONDVA_OFFER_LINE, RONDVA_PACK, RONDVA_PLANS, usd } from "@/lib/rondva-pricing";

// rondva.com/llms.txt (proxy endurskrifar á /rondva/llms.txt, eins og robots.txt). Stutt, staðreyndalegt
// yfirlit fyrir svarvélar: hvað Rondva er, fyrir hverja, lönd, prufa, verð og slóðir. Sömu
// staðreyndir og á forsíðu, /nz og í JSON-LD (src/lib/rondva-seo.ts); engar einkunnir eða
// „best/only“-fullyrðingar.
export const dynamic = "force-static";

export function GET() {
  const R = BRANDS.rondva;
  const [solo, pro] = RONDVA_PLANS;
  const body = [
    "# Rondva",
    "",
    "> Rondva is an iPhone app that drafts building inspection reports, including NZS 4306:2005 pre-purchase reports, from the inspector's photos, notes, moisture readings and ratings. The inspector reviews every word and issues the report under their own company name.",
    "",
    `Made by ${R.company} (reg. no. ${R.companyId}), ${R.companyAddress}. Contact: ${R.contactEmail}.`,
    "",
    "## Who it is for",
    "- Independent property inspectors and small inspection firms.",
    "- Countries: New Zealand first (NZS 4306:2005 pre-purchase reports); Australia and Ireland are also priced in the App Store.",
    "",
    "## What it does",
    "- Record the property, the areas you walk, a rating for each item, photos, thermal images and moisture readings on site.",
    "- Works with no signal: everything is saved on the phone first and syncs when back online.",
    "- Drafts the report text and summary with AI. Your severity ratings are locked; the AI cannot change them.",
    "- On NZS 4306 reports, any figure in a finding's write-up and every moisture reading must match a number the inspector entered, or Rondva falls back to the inspector's own words.",
    "- The PDF carries the inspector's company name and logo and states that the text was drafted with AI assistance.",
    "- Data is stored in the EU (Ireland).",
    "",
    "## Availability and price",
    `- iPhone app on the App Store: ${APP_STORE_URL}`,
    `- ${RONDVA_OFFER_LINE}`,
    `- ${solo.name}: ${usd(solo.price)} a month, ${solo.reports} AI-drafted reports a month. ${pro.name}: ${usd(pro.price)} a month, ${pro.reports} reports. ${RONDVA_PACK.name}: ${usd(RONDVA_PACK.price)} one-time, ${RONDVA_PACK.reports} reports that never expire.`,
    `- Prices are in USD; Apple charges in your currency incl. GST/VAT. In New Zealand, Solo is ${RONDVA_NZ_SOLO.currency}${RONDVA_NZ_SOLO.price} a month.`,
    "",
    "## Links",
    `- [NZS 4306 reports](${R.marketingUrl}/nz): what the report contains and pricing in NZ$`,
    `- [Support and FAQ](${R.marketingUrl}/support)`,
    `- [Privacy policy](${R.marketingUrl}/privacy)`,
    `- [Terms of use](${R.marketingUrl}/terms)`,
    `- [Home page](${R.marketingUrl}/)`,
    "",
  ].join("\n");
  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
