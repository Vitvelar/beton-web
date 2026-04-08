import Link from "next/link";
import { COMPANY, NAV_LINKS } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="bg-charcoal text-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <h3 className="text-lg font-semibold mb-4">{COMPANY.name}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Fagleg ástandsskoðun fasteigna með ítarlegri skýrslu. Traust og
              gagnsæi í öndvegi.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Flýtileiðir</h3>
            <ul className="space-y-2">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 text-sm hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/skodun"
                  className="text-gray-400 text-sm hover:text-white transition-colors"
                >
                  Bóka skoðun
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Upplýsingar</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>{COMPANY.location}</li>
              <li>Kt. {COMPANY.kennitala}</li>
              <li>
                <a
                  href={`mailto:${COMPANY.email}`}
                  className="hover:text-white transition-colors"
                >
                  {COMPANY.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-700 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} {COMPANY.name} Allur réttur
          áskilinn.
        </div>
      </div>
    </footer>
  );
}
