import Link from "next/link";
import { BRANDS } from "@/lib/brand";

// Sticky top header for the Rondva landing page. Logo is the horizontal
// lockup (min 96px wide per plan/rondva/brand/USAGE.md); keep at least half
// the logo height (39 / 2 ≈ 20px) of clear space around it.
//
// "Log in" goes to the dashboard on app.rondva.com (→ /dashboard/login when
// signed out). On phones the lockup and CTA shrink so both actions fit at 375px.
export function RondvaHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/85 backdrop-blur supports-[backdrop-filter]:bg-paper/70">
      <div className="mx-auto flex max-w-[1120px] items-center justify-between gap-4 px-6 py-5">
        <Link href="/" className="inline-flex shrink-0 items-center" aria-label="Rondva home">
          {/* eslint-disable-next-line @next/next/no-img-element -- static SVG lockup, no optimisation needed */}
          <img src="/rondva/logo.svg" alt="Rondva" width={137} height={39} className="h-auto w-[112px] min-w-24 sm:w-[137px]" />
        </Link>
        <nav aria-label="Account" className="flex items-center gap-1 sm:gap-2">
          <a
            href={BRANDS.rondva.appUrl}
            className="inline-flex items-center rounded-full px-3 py-2.5 text-sm font-semibold text-ink transition-colors hover:text-blue sm:px-4"
          >
            Log in
          </a>
          <Link
            href="#waitlist"
            className="inline-flex items-center whitespace-nowrap rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-blue sm:px-5"
          >
            <span className="sm:hidden">Join waitlist</span>
            <span className="hidden sm:inline">Join the waitlist</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
