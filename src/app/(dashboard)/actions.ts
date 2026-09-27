"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getDashboardLocale } from "@/lib/request-brand";
import { dashboardCopy, isDashboardLocale, USER_LOCALE_KEY } from "@/lib/i18n/dashboard";
import { isReportLocale } from "@/lib/report/i18n";
import { isRatingScheme } from "@/lib/report/settings";

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
