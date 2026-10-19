import Link from "next/link";
import { RONDVA_OFFER_LINE, RONDVA_TRIAL } from "@/lib/rondva-pricing";
import { AppStoreBadge, AppStoreQr } from "@/components/rondva/AppStoreBadge";
import type { DashboardLocale } from "@/lib/i18n/dashboard";
import { format, shellCopy } from "@/lib/i18n/dashboard-shell";
import { tapLink } from "@/lib/ui";

// Tómt ástand stjórnborðsins á app.rondva.com (aðeins Rondva): þrjú skref í stað dauðs enda.
// Birtist úr src/app/(dashboard)/dashboard/page.tsx á því máli sem notandinn valdi (is/en);
// Beton sér áfram sinn texta. Ein H1 á síðunni, skrefin eru H2.
export function RondvaDashboardEmpty({ locale }: { locale: DashboardLocale }) {
  const t = shellCopy(locale).emptyRondva;
  // Enska notar sömu tilboðslínu og kynningarsíðan (ein heimild); önnur mál sniðmátið.
  const offer = locale === "en" ? RONDVA_OFFER_LINE : format(t.offerLine, { count: RONDVA_TRIAL.freeReports });

  const steps: { title: string; body: React.ReactNode }[] = [
    {
      title: t.step1Title,
      body: (
        <>
          <p>{t.step1Body}</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-4">
            <AppStoreBadge />
            <AppStoreQr tone="light" />
          </div>
        </>
      ),
    },
    {
      title: t.step2Title,
      body: (
        <p>
          {t.step2Body}{" "}
          <Link
            href="/dashboard/settings"
            className={`${tapLink} font-semibold text-ink underline hover:text-navy`}
          >
            {t.step2Link}
          </Link>
        </p>
      ),
    },
    {
      title: t.step3Title,
      body: <p>{offer}</p>,
    },
  ];

  return (
    <div className="mx-auto max-w-2xl py-8 sm:py-16">
      <h1 className="text-2xl font-semibold text-ink">{t.title}</h1>
      <p className="mt-2 text-fog">{t.intro}</p>
      <ol className="mt-8 space-y-4">
        {steps.map((step, i) => (
          <li key={step.title} className="flex gap-4 rounded-xl border border-concrete bg-surface p-5">
            <span
              aria-hidden="true"
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-semibold text-paper"
            >
              {i + 1}
            </span>
            <div className="min-w-0 text-fog">
              <h2 className="text-base font-semibold text-ink">{step.title}</h2>
              <div className="mt-1 text-sm leading-relaxed">{step.body}</div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
