"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { NAV_LINKS } from "@/lib/constants";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <nav className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/images/beton-logo.webp"
              alt="Beton ehf. merki"
              width={140}
              height={48}
              className="h-10 w-auto"
              priority
            />
          </Link>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate hover:text-charcoal transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/skodun"
              className="inline-flex items-center justify-center rounded-md bg-charcoal px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-charcoal-light transition-colors"
            >
              Bóka skoðun
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center rounded-md p-2.5 text-slate"
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
          <div className="md:hidden pb-6 border-t border-gray-100 pt-4">
            <div className="flex flex-col gap-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-base font-medium text-slate hover:text-charcoal transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/skodun"
                className="inline-flex items-center justify-center rounded-md bg-charcoal px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-charcoal-light transition-colors mt-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Bóka skoðun
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
