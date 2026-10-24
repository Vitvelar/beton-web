// Strúktúruð gögn (JSON-LD) fyrir rondva.com — ein heimild, svo nafn, fyrirtæki, heimilisfang, verð og
// App Store-slóð séu eins á öllum síðum og samræmist þriðju aðila skráningum (App Store, LinkedIn,
// Capterra). Hver síða birtir EITT `<script type="application/ld+json">` (sjá <JsonLd/>).
//
// Reglur (PROMPT-EFTIR-SAMTHYKKI §E): engin `aggregateRating` eða umsagnir fyrr en raunverulegar
// einkunnir eru til; FAQPage-svör eru sami texti og sést á síðunni; verð í USD og merkt „price
// varies by storefront“ því Apple sýnir verð í mynt hvers lands.

import { BRANDS } from "@/lib/brand";
import { APP_STORE_URL } from "@/lib/rondva-links";
import { RONDVA_OFFER_LINE, RONDVA_PACK, RONDVA_PLANS } from "@/lib/rondva-pricing";

const R = BRANDS.rondva;
const SITE = R.marketingUrl;

export const ORGANIZATION_ID = `${SITE}/#organization`;
export const APPLICATION_ID = `${SITE}/#app`;

/**
 * Leitarvélastaðfesting og IndexNow. Staðgenglar (tómir strengir) = ekkert birtist: engin tóm meta-tög
 * og IndexNow-lykilsleiðin skilar 404. Hjalti setur raunveruleg gildi hér (sjá PR-lýsingu).
 *  - google: innihald `content` úr „HTML tag“ staðfestingu í Search Console
 *  - bing:   `msvalidate.01` gildi úr Bing Webmaster Tools (eða flytja inn úr Search Console)
 *  - indexNowKey: 32 hex-stafir (a-f0-9); skráin https://rondva.com/<key>.txt inniheldur lykilinn
 * ATH: Google hætti stuðningi við sitemap-ping (`/ping?sitemap=`) 2023, svo ekkert slíkt er sent;
 * sitemap er send inn í Search Console. Bing tekur við slóðum gegnum IndexNow.
 */
export const RONDVA_SEO = {
  verification: { google: "", bing: "" },
  indexNowKey: "",
  // Aðeins raunverulegar skráningar; tómt = síað út úr sameAs.
  profiles: {
    linkedin: "",
    capterra: "",
    getapp: "",
    softwareAdvice: "",
  },
};

/** Metadata `verification`, eða undefined ef ekkert gildi er sett (engin tóm tög). */
export function rondvaVerification(): { google?: string; other?: Record<string, string> } | undefined {
  const google = RONDVA_SEO.verification.google.trim();
  const bing = RONDVA_SEO.verification.bing.trim();
  if (!google && !bing) return undefined;
  return {
    ...(google ? { google } : {}),
    ...(bing ? { other: { "msvalidate.01": bing } } : {}),
  };
}

/** Lykill fyrir IndexNow ef hann er gildur (32 hex), annars null. */
export function rondvaIndexNowKey(): string | null {
  const key = RONDVA_SEO.indexNowKey.trim();
  return /^[a-f0-9]{32}$/i.test(key) ? key : null;
}

export type FaqItem = { q: string; a: string };

type JsonLdNode = Record<string, unknown>;

export function organizationLd(): JsonLdNode {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: R.company,
    legalName: R.company,
    url: SITE,
    email: R.contactEmail,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Hjálmholt 2",
      postalCode: "105",
      addressLocality: "Reykjavík",
      addressCountry: "IS",
    },
    // Tóm sæti (LinkedIn, Capterra, GetApp, Software Advice) eru síuð út þar til skráningin er til.
    sameAs: [APP_STORE_URL, ...Object.values(RONDVA_SEO.profiles)].filter(
      (url) => url.trim().length > 0,
    ),
  };
}

export function softwareApplicationLd(): JsonLdNode {
  const priceNote = "Price varies by storefront; charged by Apple in your currency.";
  return {
    "@type": "SoftwareApplication",
    "@id": APPLICATION_ID,
    name: "Rondva",
    alternateName: "Rondva: Building Inspections",
    operatingSystem: "iOS",
    applicationCategory: "BusinessApplication",
    description:
      "iPhone app that drafts building inspection reports, including NZS 4306:2005 pre-purchase reports, from the inspector's photos, notes and ratings. The inspector reviews and issues the report.",
    url: SITE,
    installUrl: APP_STORE_URL,
    downloadUrl: APP_STORE_URL,
    inLanguage: ["en", "is"],
    publisher: { "@id": ORGANIZATION_ID },
    offers: [
      {
        "@type": "Offer",
        name: "Free trial",
        price: "0",
        priceCurrency: "USD",
        description: RONDVA_OFFER_LINE,
      },
      ...RONDVA_PLANS.map((plan) => ({
        "@type": "Offer",
        name: `Rondva ${plan.name}`,
        price: plan.price,
        priceCurrency: "USD",
        description: `Monthly subscription, ${plan.reports} AI-drafted reports a month. ${priceNote}`,
      })),
      {
        "@type": "Offer",
        name: `Rondva ${RONDVA_PACK.name}`,
        price: RONDVA_PACK.price,
        priceCurrency: "USD",
        description: `One-time purchase of ${RONDVA_PACK.reports} extra AI-drafted reports that never expire. Plans are cheaper per report. ${priceNote}`,
      },
    ],
    // ENGIN aggregateRating / review: ekki fyrr en raunverulegar einkunnir eru til.
  };
}

export function faqPageLd(items: readonly FaqItem[]): JsonLdNode {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function breadcrumbLd(trail: ReadonlyArray<{ name: string; path: string }>): JsonLdNode {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: `${SITE}${crumb.path === "/" ? "" : crumb.path}`,
    })),
  };
}

/** Eitt @graph á síðu. `<` er escape-að svo texti geti aldrei lokað script-merkinu. */
export function jsonLdString(nodes: readonly JsonLdNode[]): string {
  return JSON.stringify({ "@context": "https://schema.org", "@graph": nodes }).replace(/</g, "\\u003c");
}
