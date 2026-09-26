import { headers } from "next/headers";
import { resolveHost, type Brand } from "@/lib/brand";
import { localeForBrand, type DashboardLocale } from "@/lib/i18n/dashboard";

// Vörumerki núverandi beiðni, lesið úr host-haus (sama kort og proxy.ts notar).
// Aðeins fyrir server components / route handlers — brand.ts sjálft má ekki
// flytja inn next/headers því proxy.ts les það líka.
//
// Óþekktur hýsill (vercel.app preview, localhost) → "beton", eins og áður.
export async function getRequestBrand(): Promise<Brand> {
  const h = await headers();
  return resolveHost(h.get("host"))?.brand ?? "beton";
}

// Tungumál stjórnborðsins fyrir núverandi beiðni. Eini staðurinn sem velur það:
// notendaval (þegar það kemur) tengist hér inn sem annað viðfang localeForBrand.
export async function getDashboardLocale(): Promise<DashboardLocale> {
  return localeForBrand(await getRequestBrand());
}
