import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow } from "@/components/Editorial";
import { btn } from "@/lib/ui";

export const metadata: Metadata = {
  title: "Síðan fannst ekki",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <section className="px-6 py-24 lg:px-14 lg:py-32">
      <div className="mx-auto max-w-[1280px]">
        <Eyebrow>404</Eyebrow>
        <h1 className="mt-6 max-w-[720px] text-h1 font-medium text-balance">Síðan fannst ekki</h1>
        <p className="mt-6 max-w-[560px] text-lead text-fog">
          Slóðin er röng eða síðan hefur verið færð.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link href="/" className={btn("primary", "lg")}>
            Á forsíðu <span aria-hidden="true">→</span>
          </Link>
          <Link href="/samband" className={btn("quiet", "lg", "px-2!")}>
            Hafa samband
          </Link>
        </div>
      </div>
    </section>
  );
}
