import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { SignOutButton } from "@/components/dashboard/SignOutButton";
import { CompanyOnboardingForm } from "@/components/rondva/CompanyOnboardingForm";
import { OnboardingPendingActions } from "@/components/rondva/OnboardingPendingActions";
import { OnboardingShell } from "@/components/rondva/OnboardingShell";
import { checkDashboardAccess, loginErrorFor, type AccessCompany } from "@/lib/access";
import { BRANDS } from "@/lib/brand";
import { dashboardCopy, fill, type DashboardLocale } from "@/lib/i18n/dashboard";
import { shellCopy } from "@/lib/i18n/dashboard-shell";
import { countryFromAcceptLanguage, countryOptions, onboardingFor } from "@/lib/onboarding";
import { getDashboardLocale, getRequestBrand, getRequestUser } from "@/lib/request-brand";
import { createClient } from "@/lib/supabase/server";

// Nýskráning fyrirtækis — AÐEINS app.rondva.com (APP-13).
//
// proxy.ts og auth-callback senda hingað innskráðan Rondva-notanda sem á ekkert
// fyrirtæki (my_access().company = null) eða hvers fyrirtæki bíður samþykkis.
// Síðan metur aðganginn aftur sjálf (vörn í dýpt):
//   ekkert fyrirtæki → skráningarform · pending → „Við förum yfir fyrirtækið"
//   virkur aðgangur → /dashboard · annað (stöðvað, villa) → innskráning með villu.
// Á Beton-lénum er síðan ekki til (404), eins og áður en hún kom.

export async function generateMetadata(): Promise<Metadata> {
  return { title: dashboardCopy(await getDashboardLocale()).onboarding.metaTitle };
}

export default async function OnboardingPage() {
  const brand = await getRequestBrand();
  if (brand !== "rondva") notFound();

  const user = await getRequestUser();
  if (!user) redirect("/dashboard/login");

  const access = await checkDashboardAccess(await createClient(), user.email, brand);
  if (access.allowed) redirect("/dashboard");
  const view = onboardingFor(brand, access);
  if (!view) redirect(`/dashboard/login?error=${loginErrorFor(access)}`);

  const locale = await getDashboardLocale();
  const t = dashboardCopy(locale).onboarding;
  const email = user.email ?? "";

  if (view === "pending") {
    return (
      <OnboardingShell email={email} locale={locale}>
        <PendingReview locale={locale} email={email} company={access.company} />
      </OnboardingShell>
    );
  }

  const defaultCountry = countryFromAcceptLanguage((await headers()).get("accept-language"));

  return (
    <OnboardingShell email={email} locale={locale}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-navy">{t.eyebrow}</p>
      <h1 className="rv-serif mt-3 text-4xl leading-tight text-ink wrap-break-word">{t.title}</h1>
      <p className="mt-3 text-base leading-relaxed text-fog">{t.intro}</p>

      <CompanyOnboardingForm locale={locale} countries={countryOptions(locale)} defaultCountry={defaultCountry} />

      <div className="mt-10 border-t border-concrete pt-6 text-sm leading-relaxed text-fog">
        {email ? <p className="break-words">{fill(t.signedInAs, { email })}</p> : null}
        <div className="mt-1">
          {t.otherAccount}{" "}
          <SignOutButton
            label={t.signOut}
            pendingLabel={shellCopy(locale).onboarding.signingOut}
            formClassName="inline"
            className="inline-flex min-h-11 items-center font-semibold text-ink underline decoration-concrete-dk underline-offset-4 transition-colors hover:decoration-ink active:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>
    </OnboardingShell>
  );
}

function PendingReview({
  locale,
  email,
  company,
}: {
  locale: DashboardLocale;
  email: string;
  company?: AccessCompany;
}) {
  const t = dashboardCopy(locale).onboarding;
  const countryName = company?.country ? countryLabel(locale, company.country) : null;
  const contact = BRANDS.rondva.contactEmail;
  const [contactBefore, contactAfter = ""] = t.contact.split("{email}");

  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-navy">{t.pendingEyebrow}</p>
      <h1 className="rv-serif mt-3 text-4xl leading-tight text-ink wrap-break-word">{t.pendingTitle}</h1>
      <p className="mt-3 text-base leading-relaxed text-fog">{t.pendingBody}</p>

      {company ? (
        <div className="mt-8 rounded-xl border border-concrete bg-surface px-5 py-4">
          <p className="break-words font-semibold text-ink">{company.name}</p>
          {countryName ? <p className="mt-0.5 text-sm text-fog">{countryName}</p> : null}
        </div>
      ) : null}

      {/* „Athuga aftur“ metur aðganginn á þjóninum og svarar á staðnum (samþykkt → stjórnborðið). */}
      <OnboardingPendingActions locale={locale} checkLabel={t.checkAgain} signOutLabel={t.signOut} />

      <div className="mt-10 space-y-2 border-t border-concrete pt-6 text-sm leading-relaxed text-fog">
        {/* Netfangið er í hausnum á breiðum skjá; hér sést það líka á símum. */}
        {email ? <p className="break-words sm:hidden">{fill(t.signedInAs, { email })}</p> : null}
        <p>
          {contactBefore}
          <a href={`mailto:${contact}`} className="font-semibold text-ink underline underline-offset-4">
            {contact}
          </a>
          {contactAfter}
        </p>
      </div>
    </>
  );
}

function countryLabel(locale: string, code: string): string {
  try {
    return new Intl.DisplayNames([locale, "en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}
