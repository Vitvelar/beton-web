import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BetonHtml } from "@/components/BetonHtml";
import { betonMetadata, betonLocalBusinessJsonLd } from "@/lib/beton-metadata";

export const metadata: Metadata = betonMetadata;

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <BetonHtml>
      <Header />
      <main className="flex-1">{children}</main>
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
