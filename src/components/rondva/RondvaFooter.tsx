import Link from "next/link";
import { BRANDS } from "@/lib/brand";
import { CookieChoicesButton } from "@/components/rondva/CookieChoicesButton";

// Dark footer for the Rondva landing page.
export function RondvaFooter() {
  return (
    <footer className="bg-ink text-paper">
      <div className="mx-auto max-w-[1120px] px-6 py-16">
        {/* eslint-disable-next-line @next/next/no-img-element -- static SVG lockup */}
        <img src="/rondva/logo-white.svg" alt="Rondva" width={137} height={39} className="h-auto w-[137px]" />

        <p className="mt-6 text-sm text-paper/70">Rondva is built by Vitvélar.</p>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <Link href="/privacy" className="text-paper/80 transition-colors hover:text-paper">
            Privacy
          </Link>
          <Link href="/cookies" className="text-paper/80 transition-colors hover:text-paper">
            Cookies
          </Link>
          <CookieChoicesButton className="text-paper/80 transition-colors hover:text-paper" />
          <a
            href={`mailto:${BRANDS.rondva.contactEmail}`}
            className="text-paper/80 transition-colors hover:text-paper"
          >
            Contact
          </a>
        </div>

        <p className="mt-10 text-xs text-paper/50">&copy; 2026 Vitvélar ehf.</p>
      </div>
    </footer>
  );
}
