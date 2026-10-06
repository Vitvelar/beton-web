import { signOut } from "@/app/(dashboard)/actions";
import { BRANDS } from "@/lib/brand";
import { dashboardCopy, type DashboardLocale } from "@/lib/i18n/dashboard";

// Umgjörð nýskráningar á app.rondva.com (/dashboard/onboarding): sami haus og
// stjórnborðið (merki + útskráning) en án stjórnborðstengla, því notandinn á
// engan aðgang enn. Aðeins Rondva — Beton-lénin birta þetta aldrei.
export function OnboardingShell({
  email,
  locale,
  children,
}: {
  email: string;
  locale: DashboardLocale;
  children: React.ReactNode;
}) {
  const t = dashboardCopy(locale).onboarding;

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="border-b border-concrete bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href={BRANDS.rondva.marketingUrl} className="inline-flex items-center" aria-label="Rondva home">
            {/* eslint-disable-next-line @next/next/no-img-element -- static SVG lockup */}
            <img src="/rondva/logo.svg" alt="Rondva" width={98} height={28} className="h-7 w-auto" />
          </a>
          <div className="flex min-w-0 items-center gap-4">
            <span className="hidden truncate text-sm text-fog sm:block">{email}</span>
            <form action={signOut}>
              <button type="submit" className="text-sm text-fog transition-colors hover:text-ink">
                {t.signOut}
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col px-5 py-10 sm:px-10 sm:py-14">
        <div className="mx-auto w-full max-w-[440px]">{children}</div>
      </main>
    </div>
  );
}
