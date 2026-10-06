import Link from "next/link";
import { RondvaHeader } from "@/components/rondva/RondvaHeader";
import { RondvaFooter } from "@/components/rondva/RondvaFooter";

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
      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-6 py-16 md:py-24">
          <p className="rv-eyebrow">{eyebrow}</p>
          <h1 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight rv-balance">{title}</h1>
          <div className="mt-6 space-y-4 text-lg text-muted leading-relaxed">{intro}</div>

          {children}

          {toc && (
            <nav aria-label="On this page" className="mt-12 rounded-card border border-line bg-paper-alt px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">On this page</p>
              <ol className="mt-3 gap-x-8 text-sm sm:columns-2">
                {sections.map((s, i) => (
                  <li key={s.id} className="flex gap-2 break-inside-avoid py-0.5">
                    <span className="rv-tnum w-5 shrink-0 text-right text-muted">{i + 1}.</span>
                    <a href={`#${s.id}`} className="underline-offset-4 hover:underline">
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

          <p className="mt-16 text-sm text-muted">
            Last revised {revised}.{" "}
            <Link href="/" className="underline underline-offset-4">
              Back to the front page
            </Link>
          </p>
        </article>
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
