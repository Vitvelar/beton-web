import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BetonHtml } from "@/components/BetonHtml";
import { betonMetadata, betonLocalBusinessJsonLd } from "@/lib/beton-metadata";
import { BRANDS } from "@/lib/brand";

// Google Tag Manager aðeins í framleiðslu (beton.is), ekki á preview-/localhost-
// útgáfum, svo auglýsingamælingar Braga mengist ekki af prófunum.
const GTM_ID =
  process.env.VERCEL_ENV === "production" ? BRANDS.beton.gtmId : undefined;

export const metadata: Metadata = betonMetadata;

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <BetonHtml gtmId={GTM_ID}>
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-60 focus:rounded-full focus:bg-ink focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-paper"
      >
        Fara í efni
      </a>
      <Header />
      <main id="content" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(betonLocalBusinessJsonLd).replace(
            /</g,
            "\\u003c"
          ),
        }}
      />
    </BetonHtml>
  );
}
