import { SignOutButton } from "@/components/dashboard/SignOutButton";
import { BRANDS } from "@/lib/brand";
import { dashboardCopy, type DashboardLocale } from "@/lib/i18n/dashboard";
import { shellCopy } from "@/lib/i18n/dashboard-shell";

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
  const shell = shellCopy(locale).onboarding;

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="border-b border-concrete bg-surface">
        <div className="mx-auto flex min-h-14 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
          <a
            href={BRANDS.rondva.marketingUrl}
            className="inline-flex min-h-11 items-center"
            aria-label={shell.homeLabel}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- static SVG lockup */}
            <img src="/rondva/logo.svg" alt="Rondva" width={98} height={28} className="h-7 w-auto" />
          </a>
          <div className="flex min-w-0 shrink-0 items-center gap-3">
            <span className="hidden truncate text-sm text-fog sm:block">{email}</span>
            <SignOutButton
              label={t.signOut}
              pendingLabel={shell.signingOut}
              className="inline-flex min-h-11 items-center whitespace-nowrap rounded-md px-2 text-sm text-fog transition-colors hover:text-ink active:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>
      </header>

      <main id="content" className="flex flex-1 flex-col px-4 py-10 sm:px-10 sm:py-14">
        <div className="mx-auto w-full max-w-[440px]">{children}</div>
      </main>
    </div>
  );
}
