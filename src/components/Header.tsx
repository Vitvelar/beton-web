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
              width={220}
              height={80}
              priority
              className="h-14 w-auto md:h-[58px]"
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-9">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-[14.5px] font-medium tracking-tight transition-colors ${
                  active === link.label ? "text-ink" : "text-fog hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/skodun"
              className="inline-flex items-center gap-2 px-5 py-[11px] bg-ink text-paper text-sm font-semibold rounded-[2px] hover:bg-navy-deep transition-colors"
            >
              Bóka skoðun
              <span className="opacity-70">→</span>
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
                  className="text-base font-medium text-fog hover:text-ink"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/skodun"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex items-center gap-2 px-5 py-3 bg-ink text-paper text-sm font-semibold rounded-[2px] mt-2 w-fit"
              >
                Bóka skoðun
                <span className="opacity-70">→</span>
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
