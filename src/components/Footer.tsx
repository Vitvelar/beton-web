import Link from "next/link";
import Image from "next/image";
import { COMPANY } from "@/lib/constants";

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M13.5 21v-7.5h2.55l.38-2.95H13.5V8.7c0-.85.24-1.43 1.46-1.43h1.56V4.63c-.27-.04-1.19-.12-2.27-.12-2.25 0-3.79 1.38-3.79 3.9v2.17H7.9v2.95h2.56V21h3.04Z" />
    </svg>
  );
}

function FCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[9.5px] font-semibold tracking-[0.16em] uppercase text-paper/45 mb-2">
        {title}
      </div>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

function FLink({ href = "#", children }: { href?: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-[12px] text-paper/75 hover:text-paper transition-colors">
      {children}
    </Link>
  );
}

export function Footer() {
  return (
    <footer className="bg-ink text-paper px-6 lg:px-14 pt-7 pb-3">
      <div className="mx-auto max-w-[1280px]">
        <div className="grid grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1.2fr] gap-5 md:gap-8 items-start">
          <div className="flex flex-col gap-3 col-span-2 md:col-span-1">
            <Link href="/" aria-label="Beton ehf." className="w-fit">
              <Image
                src="/images/beton-logo.webp"
                alt="Beton ehf."
                width={120}
                height={120}
                className="h-12 w-auto [filter:brightness(0)_invert(1)]"
              />
            </Link>
            <div className="flex items-center gap-3">
              <a
                href="https://www.instagram.com/beton_ehf"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-paper/60 hover:text-paper transition-colors"
              >
                <InstagramIcon />
              </a>
              <a
                href="https://www.facebook.com/share/1AvSTiCd6c/?mibextid=wwXIfr"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="text-paper/60 hover:text-paper transition-colors"
              >
                <FacebookIcon />
              </a>
            </div>
          </div>
          <FCol title="Þjónusta">
            <FLink href="/samband">Ástandsskoðun</FLink>
            <FLink href="/samband">Kostnaðarmat</FLink>
          </FCol>
          <FCol title="Fyrirtækið">
            <FLink href="/umokkur">Um okkur</FLink>
            <FLink href="/verdskra">Verðskrá</FLink>
            <FLink href="/skilmalar">Skilmálar</FLink>
            <FLink href="/samband">Hafa samband</FLink>
          </FCol>
          <FCol title="Hafðu samband">
            <div className="text-[12px] leading-[1.6] text-paper/70">
              <a href={`mailto:${COMPANY.email}`} className="hover:text-paper">
                {COMPANY.email}
              </a>
              <br />
              {COMPANY.location}
              <br />
              kt. {COMPANY.kennitala}
            </div>
          </FCol>
        </div>
        <div className="mt-4 pt-3 border-t border-paper/10 flex justify-between text-[10.5px] text-paper/45">
          <div>© 2026 {COMPANY.name}</div>
          <a
            href="https://admin.beton.is"
            rel="nofollow"
            className="hover:text-paper transition-colors"
          >
            Innskráning
          </a>
        </div>
      </div>
    </footer>
  );
}
