import { cache } from "react";
import { headers } from "next/headers";
import type { User } from "@supabase/supabase-js";
import { resolveHost, type Brand } from "@/lib/brand";
import { localeForBrand, USER_LOCALE_KEY, type DashboardLocale } from "@/lib/i18n/dashboard";
import { createClient } from "@/lib/supabase/server";
import type { RatingScheme } from "@/lib/report/settings";
import { fetchCompanyReportSettings } from "@/lib/report/company-settings";

// Vörumerki núverandi beiðni, lesið úr host-haus (sama kort og proxy.ts notar).
// Aðeins fyrir server components / route handlers — brand.ts sjálft má ekki
// flytja inn next/headers því proxy.ts les það líka.
//
// Óþekktur hýsill (vercel.app preview, localhost) → "beton", eins og áður.
export async function getRequestBrand(): Promise<Brand> {
  const h = await headers();
  return resolveHost(h.get("host"))?.brand ?? "beton";
}

// Innskráður notandi beiðninnar, sóttur EINU sinni á hverja render-umferð
// (React cache) — útlitið og tungumálavalið deila sama getUser-kalli.
// Hvers kyns villa (t.d. tómar NEXT_PUBLIC_* á beton.is Docker-myndinni) = enginn notandi.
export const getRequestUser = cache(async (): Promise<User | null> => {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    return data.user;
  } catch {
    return null;
  }
});

// Tungumál stjórnborðsins fyrir núverandi beiðni — eini staðurinn sem velur það.
// Beton les aldrei notandann (alltaf íslenska); Rondva notar val notandans
// (user_metadata.ui_locale, stillt á stillingasíðunni eða í appinu) eða ensku.
export const getDashboardLocale = cache(async (): Promise<DashboardLocale> => {
  const brand = await getRequestBrand();
  if (brand !== "rondva") return localeForBrand(brand);
  const user = await getRequestUser();
  return localeForBrand(brand, user?.user_metadata?.[USER_LOCALE_KEY]);
});

// Matskerfi fyrirtækis innskráða notandans fyrir merki í stjórnborðinu (skoðun,
// athugasemd). Beton og notendur án fyrirtækis: alltaf núverandi kerfi. Notandi sér
// aðeins eigin skoðanir (RLS), svo fyrirtæki hans er fyrirtæki skoðunarinnar.
export const getDashboardRatingScheme = cache(async (): Promise<RatingScheme> => {
  if ((await getRequestBrand()) !== "rondva") return "standard";
  try {
    const supabase = await createClient();
    const company = await fetchCompanyReportSettings(supabase, { ownerOnly: false });
    return company ? company.settings.scheme : "standard";
  } catch {
    return "standard";
  }
});
