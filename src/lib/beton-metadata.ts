import type { Metadata } from "next";
import { COMPANY } from "@/lib/constants";

// Sameiginleg Beton-metadata fyrir allar Beton-rótarútlitsskrár ((main),
// (dashboard)). Flutt óbreytt úr gamla src/app/layout.tsx þegar
// Rondva fékk eigin rótarútlit.
const OG_IMAGE = {
  url: "/images/og-beton.jpg",
  width: 1200,
  height: 630,
  alt: "Beton ehf. — Ástandsskoðun fasteigna á höfuðborgarsvæðinu",
};

export const betonMetadata: Metadata = {
  metadataBase: new URL("https://beton.is"),
  title: {
    default: "Beton ehf. | Ástandsskoðun fasteigna á höfuðborgarsvæðinu",
    template: "%s | Beton ehf.",
  },
  description:
    "Fagleg ástandsskoðun fasteigna á höfuðborgarsvæðinu. Beton ehf. veitir hlutlausa ráðgjöf fyrir kaupendur og seljendur. Hafnarfjörður, Ísland.",
  openGraph: {
    title: "Beton ehf. — Ástandsskoðun fasteigna",
    description:
      "Fagleg ástandsskoðun fasteigna með ítarlegri skýrslu. Traust og gagnsæi í öndvegi.",
    locale: "is_IS",
    type: "website",
    siteName: "Beton ehf.",
    url: "https://beton.is",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Beton ehf. — Ástandsskoðun fasteigna",
    description:
      "Fagleg og hlutlaus ástandsskoðun fasteigna á höfuðborgarsvæðinu.",
    images: [OG_IMAGE.url],
  },
  alternates: {
    canonical: "https://beton.is",
    languages: {
      is: "https://beton.is",
      "x-default": "https://beton.is",
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

/**
 * Metadata fyrir undirsíðu á beton.is: titill, lýsing, canonical og
 * openGraph/twitter með titli, lýsingu og slóð síðunnar sjálfrar (annars erfa
 * allar síður forsíðuspjaldið). Titillinn fær „| Beton ehf." úr titilsniðmátinu.
 */
export function betonPageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const url = `https://beton.is${path}`;
  const fullTitle = `${title} | Beton ehf.`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      locale: "is_IS",
      type: "website",
      siteName: "Beton ehf.",
      url,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [OG_IMAGE.url],
    },
  };
}

export const betonLocalBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "HomeAndConstructionBusiness",
  name: COMPANY.name,
  url: "https://beton.is",
  logo: "https://beton.is/images/beton-logo.webp",
  image: "https://beton.is/images/hero.jpg",
  description:
    "Fagleg ástandsskoðun fasteigna á höfuðborgarsvæðinu. Traust, hlutlaus ráðgjöf fyrir kaupendur og seljendur.",
  email: COMPANY.email,
  telephone: "+354 899 8600",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Hafnarfjörður",
    postalCode: "220",
    addressCountry: "IS",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 64.0669,
    longitude: -21.9408,
  },
  areaServed: [
    { "@type": "City", name: "Reykjavík" },
    { "@type": "City", name: "Hafnarfjörður" },
    { "@type": "City", name: "Kópavogur" },
    { "@type": "City", name: "Garðabær" },
    { "@type": "City", name: "Mosfellsbær" },
    { "@type": "City", name: "Seltjarnarnes" },
  ],
  priceRange: "129.900 kr. - 219.900 kr.",
  founder: {
    "@type": "Person",
    name: COMPANY.founder,
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Ástandsskoðun fasteigna",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Ástandsskoðun — 0–100 m²",
        },
        priceCurrency: "ISK",
        price: "129900",
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Ástandsskoðun — 101–200 m²",
        },
        priceCurrency: "ISK",
        price: "159900",
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Ástandsskoðun — 201–300 m²",
        },
        priceCurrency: "ISK",
        price: "189900",
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Ástandsskoðun — 301–400 m²",
        },
        priceCurrency: "ISK",
        price: "219900",
      },
    ],
  },
};
