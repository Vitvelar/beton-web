import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CompanyCountryForm } from "@/components/dashboard/CompanyCountryForm";
import { CompanyBrandingForm } from "@/components/dashboard/CompanyBrandingForm";
import { LanguageSetting } from "@/components/dashboard/LanguageSetting";
import { ReportSettingsForm } from "@/components/dashboard/ReportSettingsForm";
import { SignInMethods } from "@/components/dashboard/SignInMethods";
import { getDashboardLocale, getRequestBrand } from "@/lib/request-brand";
import { linkedIdentities } from "@/lib/sign-in-methods";
import { dashboardCopy, fill } from "@/lib/i18n/dashboard";
import { shellCopy } from "@/lib/i18n/dashboard-shell";
import { tapLink } from "@/lib/ui";
import { fetchCompanyReportSettings } from "@/lib/report/company-settings";
import { isopOfferedTo, texasNotice } from "@/lib/report/isop";
import { countryOptions } from "@/lib/onboarding";
import { BETON_COMPANY_ID } from "@/lib/beton-drive";

export async function generateMetadata(): Promise<Metadata> {
  return { title: dashboardCopy(await getDashboardLocale()).settings.metaTitle };
}

export default async function SettingsPage() {
  const locale = await getDashboardLocale();
  const brand = await getRequestBrand();
  const copy = dashboardCopy(locale);
  const t = copy.settings;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: inspector } = await supabase
    .from("inspectors")
    .select("full_name, company_name, company_logo_url, company_terms_url, company_terms_text")
    .eq("user_id", user.id)
    .maybeSingle();

  // Skýrslumál og matskerfi fyrirtækis: aðeins á app.rondva.com og aðeins fyrir eiganda.
  // Ef dálkarnir eru ekki til enn (flutningurinn ekki keyrður) bregst uppflettingin og
  // spjaldið felst — vefurinn má því fara út á undan gagnagrunnsbreytingunni. Sama gildir
  // um skýrslusniðið (report_standard) og réttindi skoðunarmanns (qualifications): þau
  // birtast aðeins þegar NZS 4306-flutningurinn er kominn.
  const reportSettings = brand === "rondva" ? await ownerReportSettings(supabase) : null;
  const qualifications = brand === "rondva" && inspector ? await inspectorQualifications(supabase, user.id) : null;

  // Skýrslusnið fyrirtækisins (hvaða meðlimur sem er) ræður réttindareitnum: nzs_4306 óbreytt, isop með eigin orðalagi,
  // staðlaða sniðið prentar hann ekki (reiturinn felst, vistuð gögn haldast). Óþekkt snið = núverandi hegðun.
  const memberStandard =
    brand === "rondva" && qualifications ? (await fetchCompanyReportSettings(supabase, { ownerOnly: false }).catch(() => null))?.settings.standard ?? null : null;

  const autoSaves = brand === "rondva";

  return (
    <div className="max-w-2xl">
      <Link href="/dashboard" className={`${tapLink} -ml-1 px-1 text-sm text-fog transition-colors hover:text-ink`}>
        {t.backToList}
      </Link>
      <div className="mb-6 mt-1">
        <h1 className="text-2xl font-semibold text-ink">{t.metaTitle}</h1>
        {autoSaves ? <p className="mt-1 text-sm text-fog">{shellCopy(locale).settings.autoSave}</p> : null}
      </div>

      {/* Beton er alltaf á íslensku — tungumálavalið er aðeins á app.rondva.com.
          Reitirnir sjálfir eru í eigin einingum; fyrirsagnir hvers korts (H2) eru hér
          þar sem einingin ber enga (Tungumál: falin, merkimiðinn í kortinu segir það sama). */}
      {brand === "rondva" ? (
        <section aria-labelledby="settings-language">
          <h2 id="settings-language" className="sr-only">
            {copy.language.title}
          </h2>
          <LanguageSetting locale={locale} />
        </section>
      ) : null}
      {/* Land fyrirtækis: aðeins eigandi á app.rondva.com, aldrei Beton-fyrirtækið. Skýrslustillingarnar
          endurhlaðast með nýju landi (snið/matskerfi geta hafa hreinsast), en ekki við eigin vistun þeirra. */}
      {reportSettings && reportSettings.country && reportSettings.companyId !== BETON_COMPANY_ID ? (
        <CompanyCountryForm
          locale={locale}
          country={reportSettings.country}
          reportStandard={reportSettings.reportStandard}
          countries={countryOptions(locale)}
        />
      ) : null}
      {reportSettings ? <ReportSettingsForm key={reportSettings.country} locale={locale} initial={reportSettings} /> : null}

      {inspector ? (
        <section aria-labelledby="settings-company">
          <h2 id="settings-company" className="mb-3 text-lg font-semibold text-ink">
            {t.title}
          </h2>
          <CompanyBrandingForm
            userId={user.id}
            initial={{
              company_name: inspector.company_name ?? "",
              company_logo_url: inspector.company_logo_url ?? "",
              company_terms_url: inspector.company_terms_url ?? "",
              company_terms_text: inspector.company_terms_text ?? "",
              qualifications: qualifications?.value ?? "",
            }}
            locale={locale}
            showTermsText={brand === "rondva" && inspector.company_name?.trim() !== "Beton ehf."}
            showQualifications={qualifications !== null && memberStandard !== "default"}
            reportStandard={memberStandard}
          />
        </section>
      ) : (
        <p className="rounded-xl border border-concrete bg-surface p-6 text-sm text-fog">
          {t.noInspector}
        </p>
      )}

      <p className="mt-6 text-xs text-fog">
        {fill(t.inspectorNote, { name: inspector?.full_name ?? user.email })}
      </p>
      {brand === "rondva" && <SignInMethods locale={locale} identities={linkedIdentities(user.identities)} appleEnabled={process.env.RONDVA_APPLE_SIGNIN === "1"} />}
    </div>
  );
}

async function ownerReportSettings(supabase: Awaited<ReturnType<typeof createClient>>) {
  const company = await fetchCompanyReportSettings(supabase, { ownerOnly: true });
  if (!company) return null;
  const { settings, standardSupported, country } = company;
  return {
    country,
    companyId: company.companyId,
    reportLocale: settings.locale,
    ratingScheme: settings.scheme,
    reportStandard: settings.standard,
    standardSupported,
    // Home inspection (US/Kanada): sést aðeins fyrir US/CA þegar ISOP_ENABLED=1 (annars óbreytt).
    isopAvailable: standardSupported && isopOfferedTo(country),
    // Fyrirtæki hafa ekkert fylki í gagnagrunninum enn → borðinn birtist ekki fyrr en uppspretta er til.
    texas: texasNotice({ state: null }),
  };
}

// Réttindi skoðunarmanns (inspectors.qualifications, NZS 4306-flutningur). null = dálkurinn
// er ekki til enn → reiturinn felst og vistun snertir hann ekki.
async function inspectorQualifications(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data, error } = await supabase
    .from("inspectors")
    .select("qualifications")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return { value: typeof data.qualifications === "string" ? data.qualifications : "" };
}
