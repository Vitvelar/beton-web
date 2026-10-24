import Link from "next/link";
import { BRANDS } from "@/lib/brand";
import { CookieChoicesButton } from "@/components/rondva/CookieChoicesButton";
import { rvDarkLink } from "@/components/rondva/ui";

// Dark footer for the Rondva marketing pages. Text is paper or on-inverse-muted only; links are
// 44px tall on phones.
export function RondvaFooter() {
  return (
    <footer className="rv-dark bg-ink text-paper">
      <div className="px-6">
        <div className="mx-auto max-w-[1180px] py-16">
          {/* eslint-disable-next-line @next/next/no-img-element -- static SVG lockup */}
          <img src="/rondva/logo-white.svg" alt="Rondva" width={137} height={39} className="h-auto w-[137px]" />

          <p className="mt-6 text-sm text-on-inverse-muted">Rondva is built by Vitvélar.</p>

          <nav aria-label="Footer" className="mt-6">
            <ul className="flex flex-wrap items-center gap-x-6 text-sm">
              <li>
                <a href={BRANDS.rondva.appUrl} className={rvDarkLink}>
                  Log in
                </a>
              </li>
              <li>
                <Link href="/support" className={rvDarkLink}>
                  Support
                </Link>
              </li>
              <li>
                <Link href="/privacy" className={rvDarkLink}>
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className={rvDarkLink}>
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/cookies" className={rvDarkLink}>
                  Cookies
                </Link>
              </li>
              <li>
                <CookieChoicesButton className={rvDarkLink} />
              </li>
              <li>
                <a href={`mailto:${BRANDS.rondva.contactEmail}`} className={rvDarkLink}>
                  Contact
                </a>
              </li>
            </ul>
          </nav>

          <p className="mt-10 text-xs text-on-inverse-muted">&copy; {new Date().getFullYear()} Vitvélar ehf.</p>
        </div>
      </div>
    </footer>
  );
}
