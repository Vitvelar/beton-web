import Link from "next/link";
import Image from "next/image";
import { COMPANY } from "@/lib/constants";

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M13.5 21v-7.5h2.55l.38-2.95H13.5V8.7c0-.85.24-1.43 1.46-1.43h1.56V4.63c-.27-.04-1.19-.12-2.27-.12-2.25 0-3.79 1.38-3.79 3.9v2.17H7.9v2.95h2.56V21h3.04Z" />
    </svg>
  );
}

function FCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-label font-semibold uppercase text-on-inverse-muted">{title}</div>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

// Snertiflötur ≥44px á símum, 36px á stærri skjám.
const footerLink =
  "inline-flex min-h-11 w-fit items-center text-sm text-paper underline-offset-4 hover:underline md:min-h-9";

function FLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={footerLink}>
      {children}
    </Link>
  );
}

const socialLink =
  "inline-flex size-11 items-center justify-center text-on-inverse-muted transition-colors hover:text-paper";

export function Footer() {
  return (
    <footer className="bg-ink px-6 pt-12 pb-8 text-paper lg:px-14">
      <div className="mx-auto max-w-[1280px]">
        <div className="grid grid-cols-2 items-start gap-x-5 gap-y-8 md:grid-cols-[1.4fr_1fr_1fr_1.2fr] md:gap-8">
          <div className="col-span-2 flex flex-col gap-3 md:col-span-1">
            <Link href="/" aria-label="Beton ehf. — forsíða" className="w-fit">
              <Image
                src="/images/beton-logo.webp"
                alt=""
                width={120}
                height={120}
                className="h-12 w-auto brightness-0 invert"
              />
            </Link>
            <div className="-ml-3 flex items-center">
              <a
                href="https://www.instagram.com/beton_ehf"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Beton á Instagram (opnast í nýjum glugga)"
                className={socialLink}
              >
                <InstagramIcon />
              </a>
              <a
                href="https://www.facebook.com/share/1AvSTiCd6c/?mibextid=wwXIfr"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Beton á Facebook (opnast í nýjum glugga)"
                className={socialLink}
              >
                <FacebookIcon />
              </a>
            </div>
          </div>
          <FCol title="Þjónusta">
            <FLink href="/samband">Ástandsskoðun</FLink>
            <FLink href="/samband">Kostnaðaráætlun</FLink>
            <FLink href="/app">Skoðunarappið</FLink>
          </FCol>
          <FCol title="Fyrirtækið">
            <FLink href="/umokkur">Um okkur</FLink>
            <FLink href="/verdskra">Verðskrá</FLink>
            <FLink href="/skilmalar">Skilmálar</FLink>
            <FLink href="/personuvernd">Persónuvernd</FLink>
            <FLink href="/samband">Hafa samband</FLink>
          </FCol>
          <FCol title="Hafðu samband">
            <a href={`mailto:${COMPANY.email}`} className={footerLink}>
              {COMPANY.email}
            </a>
            <a href={COMPANY.phoneHref} className={footerLink}>
              Sími {COMPANY.phone}
            </a>
            <p className="mt-1 text-sm leading-relaxed text-on-inverse-muted">
              {COMPANY.location}
              <br />
              kt. {COMPANY.kennitala}
            </p>
          </FCol>
        </div>
        <div className="mt-8 flex items-center justify-between border-t border-paper/15 pt-4 text-sm text-on-inverse-muted">
          <div>
            © {new Date().getFullYear()} {COMPANY.name}
          </div>
          <a
            href="https://admin.beton.is"
            rel="nofollow"
            className="inline-flex min-h-11 items-center text-paper underline-offset-4 hover:underline"
          >
            Innskráning
          </a>
        </div>
      </div>
    </footer>
  );
}
