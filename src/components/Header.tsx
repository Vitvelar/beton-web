"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { NAV_LINKS } from "@/lib/constants";

interface HeaderProps {
  active?: string;
}

export function Header({ active }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-paper/92 border-b border-concrete">
      <nav className="mx-auto max-w-[1280px] px-6 lg:px-14">
        <div className="flex h-24 items-center justify-between">
          <Link href="/" className="flex items-center gap-3" aria-label="Beton ehf.">
            <Image
              src="/images/beton-logo.webp"
              alt="Beton ehf."
              width={264}
              height={96}
              priority
              className="h-20 w-auto md:h-[88px]"
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-9">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-[13px] font-semibold tracking-[0.18em] uppercase transition-colors ${
                  active === link.label
                    ? "text-gold border-b border-gold pb-1"
                    : "text-gold/85 hover:text-gold"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/samband"
              className="inline-flex items-center gap-2 px-6 py-[11px] bg-navy text-paper text-[13px] font-semibold tracking-[0.12em] uppercase rounded-full hover:bg-navy-deep transition-colors"
            >
              Hafa samband
              <span className="opacity-80">→</span>
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center p-2.5 text-fog"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Loka valmynd" : "Opna valmynd"}
          >
            {mobileMenuOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-6 border-t border-concrete pt-4">
            <div className="flex flex-col gap-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-[13px] font-semibold tracking-[0.18em] uppercase text-gold/85 hover:text-gold"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/samband"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-navy text-paper text-[13px] font-semibold tracking-[0.12em] uppercase rounded-full mt-2 w-fit"
              >
                Hafa samband
                <span className="opacity-80">→</span>
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
