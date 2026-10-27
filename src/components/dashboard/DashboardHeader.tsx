"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/dashboard/SignOutButton";
import type { Brand } from "@/lib/brand";
import { dashboardCopy, type DashboardLocale } from "@/lib/i18n/dashboard";
import { shellCopy } from "@/lib/i18n/dashboard-shell";
import { stadaCopy } from "@/lib/i18n/stada";

// Snertiflötur ≥44px, aldrei línuskipting („Sign out“ á 320px), núverandi síða merkt
// með aria-current + áherslustriki.
const navItem =
  "inline-flex min-h-11 items-center whitespace-nowrap rounded-md px-2 text-sm text-fog " +
  "transition-colors hover:text-ink active:opacity-80 disabled:cursor-not-allowed disabled:opacity-50 " +
  "aria-[current=page]:font-medium aria-[current=page]:text-ink aria-[current=page]:underline " +
  "aria-[current=page]:decoration-navy aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-8";

export function DashboardHeader({
  email,
  brand,
  locale,
  showStatus = false,
}: {
  email: string;
  brand: Brand;
  locale: DashboardLocale;
  /** Staðutengill (/dashboard/stada): aðeins eigendur á app.rondva.com; Beton-hausinn breytist ekki. */
  showStatus?: boolean;
}) {
  const t = dashboardCopy(locale).header;
  const shell = shellCopy(locale);
  const pathname = usePathname();
  const onSettings = pathname.startsWith("/dashboard/settings");
  const onStatus = pathname.startsWith("/dashboard/stada");

  return (
    <header className="border-b border-concrete bg-surface print:hidden">
      <div className="mx-auto flex min-h-14 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
        <Link
          href="/dashboard"
          className="flex min-h-11 min-w-0 items-center gap-3 rounded-md"
          aria-current={pathname === "/dashboard" ? "page" : undefined}
        >
          {brand === "rondva" ? (
            // eslint-disable-next-line @next/next/no-img-element -- static SVG lockup
            <img src="/rondva/logo.svg" alt="Rondva" width={98} height={28} className="h-7 w-auto shrink-0" />
          ) : (
            // Myndin er ferningur með mikinn auðan jaðar (sýnilegt merki er um helmingur
            // hæðarinnar): 48px mynd gefur ~24px sýnilegt merki.
            <Image
              src="/images/beton-logo.webp"
              alt="Beton"
              width={48}
              height={48}
              className="size-12 shrink-0"
            />
          )}
          <span className="hidden truncate font-mono text-xs uppercase tracking-wider text-fog sm:inline">
            {t.section}
          </span>
        </Link>

        <nav aria-label={shell.header.nav} className="flex shrink-0 items-center gap-1 sm:gap-3">
          {showStatus ? (
            <Link href="/dashboard/stada" aria-current={onStatus ? "page" : undefined} className={navItem}>
              {stadaCopy(locale).navLabel}
            </Link>
          ) : null}
          <Link
            href="/dashboard/settings"
            aria-current={onSettings ? "page" : undefined}
            className={navItem}
          >
            {t.settings}
          </Link>
          <span className="hidden max-w-56 truncate text-sm text-fog sm:block">{email}</span>
          <SignOutButton label={t.signOut} pendingLabel={shell.header.signingOut} className={navItem} />
        </nav>
      </div>
    </header>
  );
}
