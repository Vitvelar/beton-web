/* eslint-disable @next/next/no-html-link-for-pages -- 404-síðan stendur utan allra rótarútlita; venjulegir
   tenglar gefa fulla síðuhleðslu inn í rétt útlit (Link gerir það hvort sem er milli rótarútlita). */
import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { headers } from "next/headers";
import { BRANDS, resolveHost } from "@/lib/brand";
import { COMPANY } from "@/lib/constants";
import { APP_STORE_URL } from "@/lib/rondva-links";

// 404 fyrir slóðir sem passa við enga síðu (next.config.ts: experimental.globalNotFound).
//
// Forritið hefur mörg rótarútlit ((main), (rondva), (dashboard)) og ekkert app/layout.tsx.
// Þá skilar notFound() úr catch-all-síðu tómum <body> (`__next_error__`, efnið teiknast
// aðeins í vafranum) og rondva.com skilaði jafnvel 200. Þessi síða kemur í staðinn: rétt
// 404-staða, efni í HTML-inu sjálfu og vörumerki eftir hýsli (beton.is → Beton á íslensku,
// rondva.com → Rondva á ensku). Stílar eru innbyggðir viljandi: globals.css og rondva.css
// skilgreina sömu táknanöfn með ólíkum gildum og mega ekki hlaðast saman. Litir og stærðir
// fylgja DESIGN.md §1–§2. Stjórnborðið hefur eigin dashboard/[...rest] + not-found.tsx.

async function isRondva(): Promise<boolean> {
  return resolveHost((await headers()).get("host"))?.brand === "rondva";
}

export async function generateMetadata(): Promise<Metadata> {
  const rondva = await isRondva();
  return {
    title: rondva ? "Page not found — Rondva" : "Síðan fannst ekki | Beton ehf.",
    robots: { index: false, follow: false },
    icons: rondva
      ? { icon: [{ url: "/rondva/favicon.ico" }, { url: "/rondva/favicon.svg", type: "image/svg+xml" }] }
      : { icon: "/favicon.ico" },
  };
}

const BETON = {
  paper: "#e0e0db",
  ink: "#000000",
  fog: "#4a4a44",
  navy: "#003fba",
  line: "#c5c5bf",
};

const RONDVA = {
  paper: "#fafbfc",
  ink: "#101418",
  muted: "#5a6672",
  blue: "#1b4fd8",
  line: "#e2e6eb",
};

const pill = (bg: string, fg: string): CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  minHeight: 48,
  padding: "0 28px",
  borderRadius: 9999,
  background: bg,
  color: fg,
  fontSize: 15,
  fontWeight: 600,
  textDecoration: "none",
});

const quiet = (color: string): CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  minHeight: 48,
  padding: "0 8px",
  color,
  fontSize: 15,
  fontWeight: 600,
  textUnderlineOffset: 4,
});

const focusCss = (color: string) =>
  `a:focus-visible{outline:2px solid ${color};outline-offset:2px}a:hover{opacity:.88}` +
  `*{box-sizing:border-box}body{margin:0;-webkit-font-smoothing:antialiased}`;

export default async function GlobalNotFound() {
  return (await isRondva()) ? <RondvaNotFound /> : <BetonNotFound />;
}

function BetonNotFound() {
  const c = BETON;
  return (
    <html lang="is" style={{ colorScheme: "light" }}>
      <body
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          background: c.paper,
          color: c.ink,
          fontFamily: 'Epilogue, system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        <style>{focusCss(c.navy)}</style>
        <header style={{ borderBottom: `1px solid ${c.line}`, padding: "16px 24px" }}>
          <a href="/" aria-label="Beton ehf. — forsíða" style={{ display: "inline-flex" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/beton-logo.webp" alt="Beton ehf." width={96} height={64} style={{ height: 56, width: "auto" }} />
          </a>
        </header>
        <main style={{ flex: 1, padding: "clamp(64px, 12vw, 128px) 24px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: c.navy }}>
              404
            </p>
            <h1
              style={{
                margin: "24px 0 0",
                maxWidth: 720,
                fontSize: "clamp(2.25rem, 6vw, 4rem)",
                lineHeight: 1.04,
                letterSpacing: "-0.03em",
                fontWeight: 500,
              }}
            >
              Síðan fannst ekki
            </h1>
            <p style={{ margin: "24px 0 0", maxWidth: 560, fontSize: "1.125rem", lineHeight: 1.65, color: c.fog }}>
              Slóðin er röng eða síðan hefur verið færð.
            </p>
            <div style={{ marginTop: 40, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
              <a href="/" style={pill(c.navy, c.paper)}>
                Á forsíðu <span aria-hidden="true">&nbsp;→</span>
              </a>
              <a href="/samband" style={quiet(c.navy)}>
                Hafa samband
              </a>
            </div>
          </div>
        </main>
        <footer style={{ background: c.ink, color: c.paper, padding: "32px 24px", fontSize: 14 }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: "8px 24px" }}>
            <span>Beton ehf.</span>
            <a href={`mailto:${COMPANY.email}`} style={{ color: c.paper }}>
              {COMPANY.email}
            </a>
            <a href={COMPANY.phoneHref} style={{ color: c.paper }}>
              {COMPANY.phone}
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}

function RondvaNotFound() {
  const c = RONDVA;
  return (
    <html lang="en" style={{ colorScheme: "light" }}>
      <body
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          background: c.paper,
          color: c.ink,
          fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        <style>{focusCss(c.blue)}</style>
        <header style={{ borderBottom: `1px solid ${c.line}`, padding: "16px 24px" }}>
          <div style={{ maxWidth: 1180, margin: "0 auto" }}>
            <a href="/" aria-label="Rondva home" style={{ display: "inline-flex" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/rondva/logo.svg" alt="Rondva" width={120} height={28} style={{ height: 28, width: "auto" }} />
            </a>
          </div>
        </header>
        <main style={{ flex: 1, padding: "clamp(64px, 12vw, 112px) 24px" }}>
          <div style={{ maxWidth: 1180, margin: "0 auto" }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: c.blue }}>
              404
            </p>
            <h1
              style={{
                margin: "16px 0 0",
                maxWidth: 680,
                fontFamily: '"Source Serif 4", Georgia, serif',
                fontWeight: 600,
                fontSize: "clamp(2.5rem, 6vw, 3.5rem)",
                lineHeight: 1.04,
                letterSpacing: "-0.02em",
              }}
            >
              There is nothing at <em style={{ fontWeight: 400, color: c.blue }}>this address.</em>
            </h1>
            <p style={{ margin: "24px 0 0", maxWidth: 560, fontSize: "1.125rem", lineHeight: 1.65, color: c.muted }}>
              The page you asked for does not exist.
            </p>
            <div style={{ marginTop: 36, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 20 }}>
              <a href="/" style={pill(c.blue, c.paper)}>
                Back to the front page
              </a>
              <a href={APP_STORE_URL} aria-label="Download Rondva on the App Store" style={{ display: "inline-flex" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/rondva/app-store-badge.svg" alt="" width={144} height={48} style={{ height: 48, width: "auto" }} />
              </a>
            </div>
          </div>
        </main>
        <footer style={{ borderTop: `1px solid ${c.line}`, padding: "24px", fontSize: 14, color: c.muted }}>
          <div style={{ maxWidth: 1180, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: "8px 24px" }}>
            <span>Rondva</span>
            <a href={`mailto:${BRANDS.rondva.contactEmail}`} style={{ color: c.muted }}>
              {BRANDS.rondva.contactEmail}
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
