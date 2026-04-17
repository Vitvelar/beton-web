import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { COMPANY } from "@/lib/constants";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://beton.is"),
  title: {
    default: "Ástandsskoðun fasteigna á höfuðborgarsvæðinu | Beton ehf.",
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
    images: [
      {
        url: "/images/hero.jpg",
        width: 1200,
        height: 630,
        alt: "Beton ehf. — Ástandsskoðun fasteigna",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Beton ehf. — Ástandsskoðun fasteigna",
    description:
      "Fagleg og hlutlaus ástandsskoðun fasteigna á höfuðborgarsvæðinu.",
    images: ["/images/hero.jpg"],
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

const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "HomeAndConstructionBusiness",
  name: COMPANY.name,
  url: "https://beton.is",
  logo: "https://beton.is/images/beton-logo.webp",
  image: "https://beton.is/images/hero.jpg",
  description:
    "Fagleg ástandsskoðun fasteigna á höfuðborgarsvæðinu. Traust, hlutlaus ráðgjöf fyrir kaupendur og seljendur.",
  email: COMPANY.email,
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="is" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(localBusinessJsonLd).replace(
              /</g,
              "\\u003c"
            ),
          }}
        />
      </body>
    </html>
  );
}
