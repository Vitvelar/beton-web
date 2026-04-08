import type { Metadata } from "next";
import { HeroSection } from "@/components/HeroSection";

export const metadata: Metadata = {
  title: "Skilmálar",
  description: "Skilmálar Beton ehf. fyrir ástandsskoðun fasteigna.",
};

export default function Skilmalar() {
  return (
    <>
      <HeroSection
        title="Skilmálar"
        subtitle="Skilmálar Beton ehf. fyrir ástandsskoðun fasteigna."
        imageSrc="/images/hero.jpg"
        imageAlt="Beton ehf. skilmálar"
      />

      <section className="py-24 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <div className="bg-light-gray rounded-2xl p-12 ring-1 ring-gray-200">
            <svg
              className="w-16 h-16 text-warm-gray mx-auto mb-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
            <h2 className="text-2xl font-bold text-charcoal mb-4">
              Skilmálar Beton ehf.
            </h2>
            <p className="text-slate mb-8">
              Skoðaðu og halaðu niður skilmálum Beton ehf. fyrir ástandsskoðun
              fasteigna.
            </p>
            <a
              href="/documents/skilmalar-beton-ehf.pdf"
              download
              className="inline-flex items-center justify-center gap-2 rounded-md bg-charcoal px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-charcoal-light transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
              Hlaða niður skilmálum (PDF)
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
