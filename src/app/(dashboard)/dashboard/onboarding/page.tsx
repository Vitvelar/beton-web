import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { signOut } from "@/app/(dashboard)/actions";
import { CompanyOnboardingForm } from "@/components/rondva/CompanyOnboardingForm";
import { OnboardingShell } from "@/components/rondva/OnboardingShell";
import { checkDashboardAccess, loginErrorFor, type AccessCompany } from "@/lib/access";
import { BRANDS } from "@/lib/brand";
import { dashboardCopy, fill, type DashboardLocale } from "@/lib/i18n/dashboard";
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
        <PendingReview locale={locale} company={access.company} />
      </OnboardingShell>
    );
  }

  const defaultCountry = countryFromAcceptLanguage((await headers()).get("accept-language"));

  return (
    <OnboardingShell email={email} locale={locale}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy">{t.eyebrow}</p>
      <h1 className="rv-serif mt-3 text-[34px] leading-tight text-ink">{t.title}</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-fog">{t.intro}</p>

      <CompanyOnboardingForm locale={locale} countries={countryOptions(locale)} defaultCountry={defaultCountry} />

      <div className="mt-10 border-t border-concrete pt-6 text-sm leading-relaxed text-fog">
        {email ? <p className="break-words">{fill(t.signedInAs, { email })}</p> : null}
        <form action={signOut} className="mt-1">
          {t.otherAccount}{" "}
          <button
            type="submit"
            className="font-semibold text-ink underline decoration-concrete-dk underline-offset-4 transition-colors hover:decoration-ink"
          >
            {t.signOut}
          </button>
        </form>
      </div>
    </OnboardingShell>
  );
}

function PendingReview({ locale, company }: { locale: DashboardLocale; company?: AccessCompany }) {
  const t = dashboardCopy(locale).onboarding;
  const countryName = company?.country ? countryLabel(locale, company.country) : null;
  const contact = BRANDS.rondva.contactEmail;
  const [contactBefore, contactAfter = ""] = t.contact.split("{email}");

  return (
    <>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy">{t.pendingEyebrow}</p>
      <h1 className="rv-serif mt-3 text-[34px] leading-tight text-ink">{t.pendingTitle}</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-fog">{t.pendingBody}</p>

      {company ? (
        <div className="mt-8 rounded-xl border border-concrete bg-white px-5 py-4">
          <p className="break-words font-semibold text-ink">{company.name}</p>
          {countryName ? <p className="mt-0.5 text-sm text-fog">{countryName}</p> : null}
        </div>
      ) : null}

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {/* /dashboard fer um proxy.ts: samþykkt → stjórnborðið, annars aftur hingað. */}
        <Link
          href="/dashboard"
          prefetch={false}
          className="flex h-12 w-full items-center justify-center rounded-full bg-navy px-6 text-[15px] font-semibold text-white transition-colors hover:bg-navy-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
        >
          {t.checkAgain}
        </Link>
        <form action={signOut} className="w-full">
          <button
            type="submit"
            className="flex h-12 w-full items-center justify-center rounded-full border border-concrete-dk bg-white px-6 text-[15px] font-semibold text-ink transition-colors hover:border-ink/40 hover:bg-paper-alt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
          >
            {t.signOut}
          </button>
        </form>
      </div>

      <p className="mt-10 border-t border-concrete pt-6 text-sm leading-relaxed text-fog">
        {contactBefore}
        <a href={`mailto:${contact}`} className="font-semibold text-ink underline underline-offset-4">
          {contact}
        </a>
        {contactAfter}
      </p>
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
