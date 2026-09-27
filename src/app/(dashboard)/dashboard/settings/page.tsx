import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CompanyBrandingForm } from "@/components/dashboard/CompanyBrandingForm";
import { LanguageSetting } from "@/components/dashboard/LanguageSetting";
import { ReportSettingsForm } from "@/components/dashboard/ReportSettingsForm";
import { SignInMethods } from "@/components/dashboard/SignInMethods";
import { getDashboardLocale, getRequestBrand } from "@/lib/request-brand";
import { linkedIdentities } from "@/lib/sign-in-methods";
import { dashboardCopy, fill } from "@/lib/i18n/dashboard";
import { resolveReportSettings } from "@/lib/report/settings";

export async function generateMetadata(): Promise<Metadata> {
  return { title: dashboardCopy(await getDashboardLocale()).settings.metaTitle };
}

export default async function SettingsPage() {
  const locale = await getDashboardLocale();
  const brand = await getRequestBrand();
  const t = dashboardCopy(locale).settings;
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
  // spjaldið felst — vefurinn má því fara út á undan gagnagrunnsbreytingunni.
  const reportSettings = brand === "rondva" ? await ownerReportSettings(supabase) : null;

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-baseline justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-fog">{t.eyebrow}</p>
          <h1 className="text-2xl font-bold text-ink">{t.title}</h1>
        </div>
        <Link href="/dashboard" className="text-sm text-fog hover:text-ink">
          {t.backToList}
        </Link>
      </div>

      {/* Beton er alltaf á íslensku — tungumálavalið er aðeins á app.rondva.com. */}
      {brand === "rondva" ? <LanguageSetting locale={locale} /> : null}
      {reportSettings ? <ReportSettingsForm locale={locale} initial={reportSettings} /> : null}

      {inspector ? (
        <CompanyBrandingForm
          userId={user.id}
          initial={{
            company_name: inspector.company_name ?? "",
            company_logo_url: inspector.company_logo_url ?? "",
            company_terms_url: inspector.company_terms_url ?? "",
            company_terms_text: inspector.company_terms_text ?? "",
          }}
          locale={locale}
          showTermsText={brand === "rondva" && inspector.company_name?.trim() !== "Beton ehf."}
        />
      ) : (
        <p className="rounded-xl border border-concrete bg-white p-6 text-sm text-fog">
          {t.noInspector}
        </p>
      )}

      <p className="mt-6 text-xs text-fog">
        {fill(t.inspectorNote, { name: inspector?.full_name ?? user.email })}
      </p>
      {(await getRequestBrand()) === "rondva" && <SignInMethods locale={locale} identities={linkedIdentities(user.identities)} appleEnabled={process.env.RONDVA_APPLE_SIGNIN === "1"} />}
    </div>
  );
}

async function ownerReportSettings(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data, error } = await supabase
    .from("company_members")
    .select("role, companies ( report_locale, rating_scheme, country_code )")
    .eq("role", "owner")
    .maybeSingle();
  if (error || !data) return null;
  const company = Array.isArray(data.companies) ? data.companies[0] : data.companies;
  if (!company) return null;
  const settings = resolveReportSettings(company);
  return { reportLocale: settings.locale, ratingScheme: settings.scheme };
}
