import Link from "next/link";
import { BRANDS } from "@/lib/brand";
import { APP_STORE_URL } from "@/lib/rondva-links";
import { rvBtn } from "@/components/rondva/ui";

// Sticky top header for the Rondva marketing pages. Logo is the horizontal
// lockup (min 96px wide per plan/rondva/brand/USAGE.md); keep at least half
// the logo height (39 / 2 ≈ 20px) of clear space around it.
//
// The skip link is the first focusable element on every page that renders this header; each page's
// <main> has id="content". "Log in" goes to the dashboard on app.rondva.com (→ /dashboard/login
// when signed out). The row wraps instead of scrolling sideways at large text sizes.
export function RondvaHeader() {
  return (
    <>
      <a
        href="#content"
        className={`${rvBtn("primary", "md")} sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:shadow-overlay`}
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/85 backdrop-blur supports-[backdrop-filter]:bg-paper/70">
        <div className="px-6 max-[359px]:px-4">
          <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3 max-[359px]:gap-x-2">
            <Link href="/" className="inline-flex min-h-11 shrink-0 items-center" aria-label="Rondva home">
              {/* eslint-disable-next-line @next/next/no-img-element -- static SVG lockup, no optimisation needed */}
              <img src="/rondva/logo.svg" alt="Rondva" width={137} height={39} className="h-auto w-[112px] min-w-24 max-[359px]:w-24 sm:w-[137px]" />
            </Link>
            <nav aria-label="Account" className="flex flex-wrap items-center justify-end gap-x-1 gap-y-1 sm:gap-x-2">
              <a href={BRANDS.rondva.appUrl} className={rvBtn("quiet", "md", "max-[359px]:px-1")}>
                Log in
              </a>
              <a href={APP_STORE_URL} className={rvBtn("primary", "md", "max-[359px]:px-4")}>
                Get the app
              </a>
            </nav>
          </div>
        </div>
      </header>
    </>
  );
}
