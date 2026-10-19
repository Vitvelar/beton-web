"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { COMPANY, NAV_LINKS } from "@/lib/constants";
import { btn } from "@/lib/ui";

const MENU_ID = "mobile-menu";

export function Header() {
  const pathname = usePathname();
  // Valmyndin man á hvaða slóð hún var opnuð; um leið og slóðin breytist er hún
  // lokuð (engin þörf á effect til að loka eftir leiðsögn).
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const open = openedAt === pathname;
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpenedAt(null);
        toggleRef.current?.focus();
      }
    }
    function onPointerDown(e: PointerEvent) {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpenedAt(null);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  const isCurrent = (href: string) => pathname === href;

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 border-b border-concrete bg-paper/92 backdrop-blur-md"
    >
      <nav className="px-6 lg:px-14" aria-label="Aðalvalmynd">
        <div className="mx-auto max-w-[1280px]">
          <div className="flex h-16 items-center justify-between md:h-24">
            <Link href="/" className="flex items-center" aria-label="Beton ehf. — forsíða">
              <Image
                src="/images/beton-logo.webp"
                alt=""
                width={264}
                height={96}
                priority
                className="-ml-2 h-11 w-auto md:-ml-4 md:h-22"
              />
            </Link>

            {/* Desktop nav */}
            <div className="hidden items-center gap-9 lg:flex">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isCurrent(link.href) ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center border-b-2 text-label font-semibold uppercase transition-colors ${
                    isCurrent(link.href)
                      ? "border-navy text-ink"
                      : "border-transparent text-ink hover:border-concrete-dk"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/samband"
                aria-current={isCurrent("/samband") ? "page" : undefined}
                className={btn("primary", "md")}
              >
                Hafa samband <span aria-hidden="true">→</span>
              </Link>
            </div>

            {/* Mobile toggle */}
            <button
              ref={toggleRef}
              type="button"
              className="-mr-2.5 inline-flex size-11 items-center justify-center text-ink lg:hidden"
              onClick={() => setOpenedAt(open ? null : pathname)}
              aria-expanded={open}
              aria-controls={MENU_ID}
              aria-label={open ? "Loka valmynd" : "Opna valmynd"}
            >
              <svg
                className="size-6"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                aria-hidden="true"
              >
                {open ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu. Alltaf í DOM svo aria-controls vísi á þátt; `inert` lokar honum
            fyrir fókus og skjálesara meðan hann er falinn. */}
        <div
          id={MENU_ID}
          inert={!open}
          className={`grid transition-[grid-template-rows,opacity] duration-200 motion-reduce:transition-none lg:hidden ${
            open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="mx-auto max-h-[calc(100dvh-4rem)] max-w-[1280px] overflow-y-auto border-t border-concrete pb-6">
              <ul>
                {NAV_LINKS.map((link) => (
                  <li key={link.href} className="border-b border-concrete">
                    <Link
                      href={link.href}
                      aria-current={isCurrent(link.href) ? "page" : undefined}
                      className={`flex min-h-12 items-center text-base font-medium ${
                        isCurrent(link.href) ? "text-navy" : "text-ink"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-col gap-3">
                <Link
                  href="/samband"
                  aria-current={isCurrent("/samband") ? "page" : undefined}
                  className={btn("primary", "lg", "w-full")}
                >
                  Hafa samband <span aria-hidden="true">→</span>
                </Link>
                <a href={COMPANY.phoneHref} className={btn("secondary", "lg", "w-full")}>
                  Hringja {COMPANY.phone}
                </a>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
