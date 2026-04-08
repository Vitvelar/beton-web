import type { Metadata } from "next";
import Link from "next/link";
import { HeroSection } from "@/components/HeroSection";
import { COMPANY } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Bóka ástandsskoðun í Reykjavík og nágrenni",
  description:
    "Bókaðu ástandsskoðun fasteigna hjá Beton ehf. á höfuðborgarsvæðinu. Fagleg skoðun með ítarlegri skýrslu.",
  alternates: { canonical: "https://betonehf.is/skodun" },
};

export default function Skodun() {
  return (
    <>
      <HeroSection
        title="Bóka ástandsskoðun"
        subtitle="Allar tímabókanir fara í gegnum tímabókunarkerfið okkar hér fyrir neðan."
        imageSrc="/images/inspection.jpg"
        imageAlt="Húsaskoðun á fasteignum"
      />

      <section className="py-24 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-8 flex flex-wrap justify-center gap-4 text-sm">
            <Link
              href="/verdskra"
              className="text-charcoal underline underline-offset-4 hover:text-slate transition-colors"
            >
              Sjá verðskrá
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              href="/skilmalar"
              className="text-charcoal underline underline-offset-4 hover:text-slate transition-colors"
            >
              Skilmálar Beton ehf.
            </Link>
          </div>

          {/* Booking widget placeholder */}
          <div
            id="booking-widget"
            className="bg-light-gray rounded-2xl p-12 ring-1 ring-gray-200"
          >
            {/*
              BOOKING WIDGET PLACEHOLDER
              Replace this div's content with an external booking/calendar widget.
              Options: Squarespace Acuity Scheduling embed, Calendly, or Cal.com widget.
              Example: <iframe src="https://calendly.com/your-link" ... />
            */}
            <div className="max-w-md mx-auto">
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
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                />
              </svg>
              <p className="text-lg text-slate mb-4">
                Tímabókunarkerfi verður opnað fljótlega.
              </p>
              <p className="text-slate">
                Hafðu samband á{" "}
                <a
                  href={`mailto:${COMPANY.email}`}
                  className="font-semibold text-charcoal underline underline-offset-4 hover:text-slate transition-colors"
                >
                  {COMPANY.email}
                </a>{" "}
                til að bóka skoðun.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
