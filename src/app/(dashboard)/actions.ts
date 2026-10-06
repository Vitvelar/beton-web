"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getDashboardLocale } from "@/lib/request-brand";
import { dashboardCopy, isDashboardLocale, USER_LOCALE_KEY } from "@/lib/i18n/dashboard";
import { isReportLocale } from "@/lib/report/i18n";
import { isRatingScheme, isReportStandard } from "@/lib/report/settings";
import { fetchCompanyReportSettings } from "@/lib/report/company-settings";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();

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
    return failed();
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
  const { error } = await supabase.rpc("set_company_report_standard", {
    p_report_standard: reportStandard,
  });
  if (error) {
    console.error("saveReportStandard failed:", error.message);
    return failed();
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
