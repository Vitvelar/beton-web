import Link from "next/link";

// Sticky top header for the Rondva landing page. Logo is the horizontal
// lockup (min 96px wide per plan/rondva/brand/USAGE.md); keep at least half
// the logo height (39 / 2 ≈ 20px) of clear space around it.
export function RondvaHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur supports-[backdrop-filter]:bg-paper/75">
      <div className="mx-auto flex max-w-[1120px] items-center justify-between px-6 py-5">
        <Link href="/" className="inline-flex items-center" aria-label="Rondva home">
          {/* eslint-disable-next-line @next/next/no-img-element -- static SVG lockup, no optimisation needed */}
          <img src="/rondva/logo.svg" alt="Rondva" width={137} height={39} className="h-auto w-[137px] min-w-24" />
        </Link>
        <Link
          href="#waitlist"
          className="inline-flex items-center rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-blue"
        >
          Join the waitlist
        </Link>
      </div>
    </header>
  );
}
