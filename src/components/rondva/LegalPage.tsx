import Link from "next/link";
import { RondvaHeader } from "@/components/rondva/RondvaHeader";
import { RondvaFooter } from "@/components/rondva/RondvaFooter";
import { rvTapLink } from "@/components/rondva/ui";

// Sameiginlegt útlit fyrir /support, /terms og /privacy á rondva.com: haus,
// fyrirsögn, stuttur inngangur, efnisyfirlit (valfrjálst) og kaflar með
// akkerum svo appið og aðrar síður geti vísað beint á kafla (t.d. /support#delete-account).

export type LegalSection = {
  /** Akkeri kaflans — breytið ekki eftir birtingu, appið getur vísað á þau. */
  id: string;
  title: string;
  body: React.ReactNode;
};

export function LegalPage({
  eyebrow,
  title,
  intro,
  sections,
  revised,
  toc = false,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: React.ReactNode;
  sections: LegalSection[];
  /** Birt neðst: „Last revised …“. */
  revised: string;
  /** Sýna efnisyfirlit (fyrir lengri síður). */
  toc?: boolean;
  /** Efni milli inngangs og kafla (t.d. tengiliðaspjald). */
  children?: React.ReactNode;
}) {
  return (
    <>
      <RondvaHeader />
      <main id="content" className="flex-1">
        <div className="px-6">
          <article id="top" className="mx-auto max-w-[1180px] py-16 md:py-24">
            <div className="max-w-3xl">
              <p className="rv-eyebrow">{eyebrow}</p>
              <h1 className="rv-display rv-balance mt-4 text-[40px] sm:text-[48px] md:text-[56px]">{title}</h1>
              <div className="mt-6 space-y-4 text-lg text-muted leading-relaxed">{intro}</div>

              {children}

              {toc && (
                <nav aria-label="On this page" className="mt-12 rounded-card border border-line bg-paper-alt px-6 py-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">On this page</p>
                  <ol className="mt-3 gap-x-8 text-sm sm:columns-2">
                    {sections.map((s, i) => (
                      <li key={s.id} className="flex gap-2 break-inside-avoid">
                        <span className="rv-tnum flex min-h-11 w-5 shrink-0 items-center justify-end text-muted sm:min-h-0 sm:py-0.5">
                          {i + 1}.
                        </span>
                        <a
                          href={`#${s.id}`}
                          className="inline-flex min-h-11 items-center underline-offset-4 hover:underline sm:min-h-0 sm:py-0.5"
                        >
                          {s.title}
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
              )}

              <div className="mt-14 space-y-12">
                {sections.map((s, i) => (
                  <section key={s.id} id={s.id} className="scroll-mt-28">
                    <h2 className="text-xl font-semibold tracking-tight">
                      {toc && <span className="rv-tnum mr-2 text-muted">{i + 1}.</span>}
                      {s.title}
                    </h2>
                    <div className="mt-3 space-y-3 text-muted leading-relaxed">{s.body}</div>
                  </section>
                ))}
              </div>

              <div className="mt-16 flex flex-wrap items-center gap-x-6 text-sm text-muted">
                <p className="py-2">Last revised {revised}.</p>
                <Link href="/" className={rvTapLink}>
                  Back to the front page
                </Link>
                <a href="#top" className={rvTapLink}>
                  Back to top{" "}
                  <span aria-hidden="true" className="ml-1">
                    ↑
                  </span>
                </a>
              </div>
            </div>
          </article>
        </div>
      </main>
      <RondvaFooter />
    </>
  );
}

/** Tengill í meginmáli lagasíðu (undirstrikaður, opnar ytri slóðir í nýjum flipa). */
export function LegalLink({ href, children }: { href: string; children: React.ReactNode }) {
  const external = /^https?:\/\//.test(href);
  if (!external && !href.startsWith("mailto:")) {
    return (
      <Link href={href} className="underline underline-offset-4">
        {children}
      </Link>
    );
  }
  return (
    <a
      href={href}
      className="underline underline-offset-4"
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}
