"use server";

import { createClient } from "@/lib/supabase/server";
import { checkDashboardAccess } from "@/lib/access";
import { getDashboardLocale, getRequestBrand } from "@/lib/request-brand";
import { dashboardCopy } from "@/lib/i18n/dashboard";
import {
  COMPANY_WEBSITE_KEY,
  ONBOARDING_PATH,
  registerOutcome,
  validateCompanyForm,
  type CompanyField,
} from "@/lib/onboarding";

export interface OnboardingFormState {
  /** Villa á tilteknum reit (texti á tungumáli stjórnborðsins). */
  fieldErrors?: Partial<Record<CompanyField, string>>;
  /** Almenn villa sem á ekki við einn reit. */
  formError?: string;
  /**
   * Hvert vafrinn fer næst (heil síðuhleðsla í CompanyOnboardingForm). Ekki
   * redirect() úr aðgerðinni: Next sækir þá áfangastaðinn innanhúss, og í
   * serverful/standalone-ham (`next start`) fer sú beiðni á localhost-hýsil
   * sem proxy.ts les sem Beton. Vafrinn sendir alltaf réttan hýsil.
   */
  next?: string;
}

// Nýskráning fyrirtækis á app.rondva.com (APP-13). Kallar á
// public.register_company() MEÐ SETU NOTANDANS (ekki service role): fallið er
// security definer, krefst innskráðs notanda og leyfir eitt fyrirtæki á notanda.
// Staðan (active/pending) ræðst í gagnagrunninum (companies_auto_approve), ekki hér.
//
// Tókst → endurmetur aðganginn: virkt → /dashboard, annars biðsíðan (`next`).
export async function registerCompany(
  _previous: OnboardingFormState,
  formData: FormData
): Promise<OnboardingFormState> {
  const t = dashboardCopy(await getDashboardLocale()).onboarding;

  // admin.beton.is skráir aldrei fyrirtæki (síðan er ekki til þar heldur).
  if ((await getRequestBrand()) !== "rondva") return { formError: t.failed };

  const parsed = validateCompanyForm({
    name: formData.get("name"),
    country: formData.get("country"),
    website: formData.get("website"),
  });
  if (!parsed.ok) {
    const { name, country, website } = parsed.errors;
    return {
      fieldErrors: {
        ...(name ? { name: name === "required" ? t.nameRequired : t.nameLength } : {}),
        ...(country ? { country: t.countryRequired } : {}),
        ...(website ? { website: t.websiteInvalid } : {}),
      },
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { next: "/dashboard/login" };

  const { error } = await supabase.rpc("register_company", {
    p_name: parsed.value.name,
    p_country: parsed.value.country,
  });
  const outcome = registerOutcome(error);

  if (outcome === "not_authenticated") return { next: "/dashboard/login" };
  if (outcome === "invalid_company_name") return { fieldErrors: { name: t.nameLength } };
  if (outcome === "invalid_country") return { fieldErrors: { country: t.countryRequired } };
  if (outcome === "failed") {
    console.error("registerCompany failed:", error?.code ?? "", error?.message ?? "");
    return { formError: t.failed };
  }

  // "already_registered": fyrirtækið er þegar til (t.d. tvísmellt eða skráð í
  // appinu) — þá er aðeins staða þess sýnd. Vefsíðan er valfrjáls og aðeins til
  // upplýsinga, svo misheppnuð vistun hennar stöðvar ekki skráninguna.
  if (outcome === "ok" && parsed.value.website) {
    const { error: metadataError } = await supabase.auth.updateUser({
      data: { [COMPANY_WEBSITE_KEY]: parsed.value.website },
    });
    if (metadataError) console.error("registerCompany: website not saved:", metadataError.message);
  }

  const access = await checkDashboardAccess(supabase, user.email, "rondva");
  return { next: access.allowed ? "/dashboard" : ONBOARDING_PATH };
}
