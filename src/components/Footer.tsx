import Link from "next/link";
import { COMPANY } from "@/lib/constants";
import { BetonMark } from "./BetonMark";

function FCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-semibold tracking-[0.12em] uppercase text-paper/55 mb-[18px]">
        {title}
      </div>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

function FLink({ href = "#", children }: { href?: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-[13.5px] text-paper/[0.78] hover:text-paper transition-colors">
      {children}
    </Link>
  );
}

export function Footer() {
  return (
    <footer className="bg-ink text-paper px-6 lg:px-14 pt-[72px] pb-12">
      <div className="mx-auto max-w-[1280px]">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-10 md:gap-16">
          <div>
            <div className="flex items-center gap-3">
              <BetonMark color="var(--color-paper)" size={28} />
              <div className="text-[22px] font-bold tracking-[0.03em]">BETON</div>
            </div>
          </div>
          <FCol title="Þjónusta">
            <FLink href="/samband">Ástandsskoðun</FLink>
            <FLink href="/samband">Kostnaðarmat</FLink>
            <FLink href="/samband">Ástand pípulagna</FLink>
          </FCol>
          <FCol title="Fyrirtækið">
            <FLink href="/umokkur">Um okkur</FLink>
            <FLink href="/verdskra">Verðskrá</FLink>
            <FLink href="/skilmalar">Skilmálar</FLink>
            <FLink href="/samband">Hafa samband</FLink>
          </FCol>
          <FCol title="Hafðu samband">
            <div className="text-[13.5px] leading-[1.8] text-paper/75">
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
        <div className="max-w-[1280px] mx-auto mt-14 pt-7 border-t border-paper/12 flex justify-between text-[12.5px] text-paper/50">
          <div>© 2026 {COMPANY.name} Öll réttindi áskilin.</div>
        </div>
      </div>
    </footer>
  );
}
