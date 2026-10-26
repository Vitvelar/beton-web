"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getDashboardLocale } from "@/lib/request-brand";
import { dashboardCopy, isDashboardLocale, USER_LOCALE_KEY } from "@/lib/i18n/dashboard";
import { isReportLocale } from "@/lib/report/i18n";
import { isRatingScheme, isReportStandard } from "@/lib/report/settings";
import { isopSelectableTo } from "@/lib/report/isop";
import { fetchCompanyReportSettings } from "@/lib/report/company-settings";
import { countryChangeOutcome, normalizeCountryChoice } from "@/lib/company-country";
import { BETON_COMPANY_ID } from "@/lib/beton-drive";
import { getRequestBrand } from "@/lib/request-brand";

export async function signOut() {
  const supabase = await createClient();
  // „local": aðeins þessi vafri skráist út. Sjálfgefið („global") ógildir líka
  // innskráninguna í iPhone-appinu (ákvörðun eiganda 2026-10-19).
  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch (e) {
    // Kökurnar eru hreinsaðar hér að neðan hvort sem er; notandinn kemst alltaf út.
    console.error("signOut failed:", e);
  }

  const cookieStore = await cookies();
  for (const cookie of cookieStore.getAll()) {
    if (cookie.name.startsWith("sb-")) {
      cookieStore.delete(cookie.name);
    }
  }

  redirect("/dashboard/login");
}

// Tungumálaval notandans (stillingasíðan á app.rondva.com). Vistað í
// user_metadata svo appið fái sama val; admin.beton.is hunsar það (alltaf íslenska).
export async function setDashboardLocale(locale: string): Promise<{ ok: true } | { error: string }> {
  const failed = async () => ({ error: dashboardCopy(await getDashboardLocale()).language.saveFailed });
  if (!isDashboardLocale(locale)) return failed();

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ data: { [USER_LOCALE_KEY]: locale } });
  if (error) {
    console.error("setDashboardLocale failed:", error.message);
    return failed();
  }

  // Allt stjórnborðið (útlit, haus, <html lang>) birtist aftur á nýja málinu.
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

// Skýrslumál og matskerfi fyrirtækis. Aðeins eigandi — set_company_report_settings()
// (security definer, beton-app flutningur 20260927…) hafnar öllum öðrum.
export async function saveReportSettings(
  reportLocale: string,
  ratingScheme: string
): Promise<{ ok: true } | { error: string }> {
  const failed = async () => ({ error: dashboardCopy(await getDashboardLocale()).reportSettings.saveFailed });
  if (!isReportLocale(reportLocale) || !isRatingScheme(ratingScheme)) return failed();

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_company_report_settings", {
    p_report_locale: reportLocale,
    p_rating_scheme: ratingScheme,
  });
  if (error) {
    console.error("saveReportSettings failed:", error.message);
    return ratingScheme === "isop_terms"
      ? { error: dashboardCopy(await getDashboardLocale()).reportSettings.isopUnavailable }
      : failed();
  }
  revalidatePath("/dashboard/settings");
  return { ok: true };
}

// Skýrslusnið fyrirtækis (Standard / NZS 4306:2005). Aðeins eigandi —
// set_company_report_standard() (security definer, beton-app NZS 4306-flutningur) hafnar
// öllum öðrum. Skilar virkum stillingum á eftir: matskerfi án skráðs gildis fylgir sniðinu
// (NZS 4306 → nz_terms), svo valið á síðunni getur breyst með.
export async function saveReportStandard(
  reportStandard: string
): Promise<
  | { ok: true; settings: { reportLocale: string; ratingScheme: string; reportStandard: string } | null }
  | { error: string }
> {
  const failed = async () => ({ error: dashboardCopy(await getDashboardLocale()).reportSettings.saveFailed });
  if (!isReportStandard(reportStandard)) return failed();

  const supabase = await createClient();
  // 'isop' (US/Kanada): aðeins fyrir fyrirtæki í US/CA (óháð ISOP_ENABLED, sjá isopSelectableTo), og
  // kurteis villa ef gagnagrunnurinn hafnar gildinu (flutningurinn ekki keyrður).
  const unavailable = async () => ({ error: dashboardCopy(await getDashboardLocale()).reportSettings.isopUnavailable });
  if (reportStandard === "isop") {
    const current = await fetchCompanyReportSettings(supabase, { ownerOnly: true }).catch(() => null);
    if (!current || !isopSelectableTo(current.country)) return unavailable();
  }
  const { error } = await supabase.rpc("set_company_report_standard", {
    p_report_standard: reportStandard,
  });
  if (error) {
    console.error("saveReportStandard failed:", error.message);
    return reportStandard === "isop" ? unavailable() : failed();
  }
  revalidatePath("/dashboard/settings");
  const company = await fetchCompanyReportSettings(supabase, { ownerOnly: true }).catch(() => null);
  return {
    ok: true,
    settings: company
      ? {
          reportLocale: company.settings.locale,
          ratingScheme: company.settings.scheme,
          reportStandard: company.settings.standard,
        }
      : null,
  };
}

// Land fyrirtækis (stillingar á app.rondva.com, aðeins eigandi). set_company_country() (security definer,
// beton-app flutningur) er hliðið: hafnar öðrum en eiganda og læsir Beton; hér er aðeins aukavörn (Beton-vörumerkið og
// Beton-fyrirtækið fá aldrei þessa aðgerð) og þýðing villna. Ef fallið er ekki til enn í framleiðslu birtist róleg
// villa og engu er breytt. Gildin sem hreinsast (skýrslusnið/matskerfi bundið gamla landinu) skilar fallið sjálft.
export async function saveCompanyCountry(
  country: string
): Promise<{ ok: true; country: string } | { error: string }> {
  const t = dashboardCopy(await getDashboardLocale()).companyCountry;
  const code = normalizeCountryChoice(country);
  if (!code) return { error: t.failed };
  if ((await getRequestBrand()) !== "rondva") return { error: t.notOwner };

  const supabase = await createClient();
  const current = await fetchCompanyReportSettings(supabase, { ownerOnly: true }).catch(() => null);
  if (!current) return { error: t.notOwner };
  if (current.companyId === BETON_COMPANY_ID) return { error: t.notOwner };

  const { error } = await supabase.rpc("set_company_country", { p_country: code });
  const outcome = countryChangeOutcome(error);
  if (outcome !== "ok") {
    console.error("saveCompanyCountry failed:", outcome, error?.message);
    switch (outcome) {
      case "not_owner":
      case "locked":
      case "not_authenticated":
        return { error: t.notOwner };
      case "not_allowed":
        return { error: t.notAllowed };
      case "unavailable":
        return { error: t.unavailable };
      default:
        return { error: t.failed };
    }
  }
  // Skýrslustillingar (snið/matskerfi) geta hafa hreinsast; kortið og tengd spjöld lesa aftur.
  revalidatePath("/dashboard/settings");
  return { ok: true, country: code };
}
