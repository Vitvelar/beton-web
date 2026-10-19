import type { Metadata } from "next";
import { BRANDS } from "@/lib/brand";

// Metadata fyrir undirsíður rondva.com. Next sameinar `openGraph` og `twitter` grunnt (síða
// kemur í stað útlitsins), svo hver síða þarf sinn titil, lýsingu, slóð og mynd — annars
// deila öll deili sömu forsíðuspjöldum.
const SITE = BRANDS.rondva.marketingUrl;
const OG_IMAGE = { url: "/rondva/og-1200x630.png", width: 1200, height: 630, alt: "Rondva" };

export function rondvaPageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const url = `${SITE}${path}`;
  const social = `${title} — Rondva`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: social,
      description,
      type: "website",
      locale: "en_US",
      siteName: "Rondva",
      url,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: social,
      description,
      images: [OG_IMAGE.url],
    },
  };
}
