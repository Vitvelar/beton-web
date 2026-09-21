// Vörumerkja- og hýsilkort. Eitt Next-verkefni þjónar tveimur vörumerkjum:
//
//   beton   — Beton ehf. (Bragi). beton.is = markaðssíða, admin.beton.is = stjórnborð.
//   rondva  — alþjóðlega SaaS-útgáfan (Vitvélar). rondva.com = kynningarsíða,
//             app.rondva.com = stjórnborð.
//
// proxy.ts les þetta kort í stað harðkóðaðra strengja. Nýtt lén = ein lína hér.
// Óþekkt hýsill (vercel.app preview, localhost) fær `null` og hegðar sér eins og
// beton-markaðssíða án tilvísana — sama og áður.

export type Brand = "beton" | "rondva";
export type HostRole = "marketing" | "app";

export interface HostConfig {
  brand: Brand;
  role: HostRole;
  /** Stjórnborðshýsill sem /dashboard á markaðshýsli vísar á. */
  adminHost?: string;
}

export const HOSTS: Readonly<Record<string, HostConfig>> = {
  "beton.is": { brand: "beton", role: "marketing", adminHost: "admin.beton.is" },
  "www.beton.is": { brand: "beton", role: "marketing", adminHost: "admin.beton.is" },
  "admin.beton.is": { brand: "beton", role: "app" },
  "rondva.com": { brand: "rondva", role: "marketing", adminHost: "app.rondva.com" },
  "www.rondva.com": { brand: "rondva", role: "marketing", adminHost: "app.rondva.com" },
  "app.rondva.com": { brand: "rondva", role: "app" },
};

/** Slóðarforskeyti sem Rondva-kynningarsíðan býr undir í app/ (rewrite í proxy). */
export const RONDVA_ROUTE_PREFIX = "/rondva";

export function resolveHost(hostHeader: string | null | undefined): HostConfig | null {
  if (!hostHeader) return null;
  const host = hostHeader.split(":")[0].trim().toLowerCase();
  return HOSTS[host] ?? null;
}

export const BRANDS = {
  beton: {
    name: "Beton ehf.",
    marketingUrl: "https://beton.is",
    appUrl: "https://admin.beton.is",
  },
  rondva: {
    name: "Rondva",
    company: "Vitvélar ehf.",
    companyId: "591206-1090",
    companyAddress: "Hjálmholt 2, 105 Reykjavík, Iceland",
    marketingUrl: "https://rondva.com",
    appUrl: "https://app.rondva.com",
    // Tengiliðanetfang þar til rondva.com fær eigin pósthólf.
    contactEmail: "hjalti@vitvelar.is",
  },
} as const;
