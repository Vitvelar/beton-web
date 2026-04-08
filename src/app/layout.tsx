import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "Beton ehf. — Ástandsskoðun fasteigna",
    template: "%s | Beton ehf.",
  },
  description:
    "Beton ehf. sérhæfir sig í ástandsskoðunum fasteigna og veitir faglega og hlutlausa ráðgjöf fyrir bæði kaupendur og seljendur. Hafnarfjörður, Ísland.",
  openGraph: {
    title: "Beton ehf. — Ástandsskoðun fasteigna",
    description:
      "Fagleg ástandsskoðun fasteigna með ítarlegri skýrslu. Traust og gagnsæi í öndvegi.",
    locale: "is_IS",
    type: "website",
    siteName: "Beton ehf.",
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
      </body>
    </html>
  );
}
