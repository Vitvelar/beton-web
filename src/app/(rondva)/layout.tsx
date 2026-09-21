import type { Metadata, Viewport } from "next";
import { inter } from "@/lib/fonts/rondva";
import { BRANDS } from "@/lib/brand";
import "./rondva.css";

// Rótarútlit Rondva. Sjálfstætt frá Beton: enska, Inter, eigin metadata og
// eigin stílblað. Slóðirnar hér undir eru /rondva/* í app/ en birtast sem
// rondva.com/* (sjá rewrite í src/proxy.ts).

const SITE = BRANDS.rondva.marketingUrl;
const TITLE = "Rondva — Walk the property. Rondva drafts the report.";
const DESCRIPTION =
  "Rondva is a field app for independent property inspectors. Record rooms, photos, thermal images and severity on your phone; Rondva drafts the report text and summary. In development — join the waitlist.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: TITLE,
    template: "%s — Rondva",
  },
  description: DESCRIPTION,
  applicationName: "Rondva",
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    locale: "en_US",
    siteName: "Rondva",
    url: SITE,
    images: [
      {
        url: "/rondva/og-1200x630.png",
        width: 1200,
        height: 630,
        alt: "Rondva",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/rondva/og-1200x630.png"],
  },
  alternates: {
    canonical: SITE,
    languages: {
      en: SITE,
      "x-default": SITE,
    },
  },
  icons: {
    icon: [
      { url: "/rondva/favicon.ico", sizes: "48x48" },
      { url: "/rondva/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/rondva/favicon-180.png",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#101418",
  width: "device-width",
  initialScale: 1,
};

export default function RondvaRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-paper text-ink">
        {children}
      </body>
    </html>
  );
}
