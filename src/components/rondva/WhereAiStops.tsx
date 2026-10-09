import { IconShield } from "@/components/rondva/RondvaIcons";
import { SectionHeading } from "@/components/rondva/SectionHeading";

// „Where the AI stops“ — sameiginlegt á forsíðu og /nz. Hver lína verður að vera sönn í kóðanum
// (alvarleiki endurheimtur úr gildum skoðunarmanns; talna- og rakavörn á NZS 4306-leið).
const whereAiStops = [
  {
    title: "Your ratings are locked.",
    body: "The AI cannot change the severity you set on any finding.",
  },
  {
    title: "A Rondva report is not a certified engineering conclusion",
    body: "and doesn’t present itself as one. It’s your professional inspection, written up.",
  },
  {
    title: "Nothing is claimed to be complete.",
    body: "No app can guarantee every defect in a building is found — Rondva documents what you observed and recorded.",
  },
  {
    title: "You review before anything leaves the app.",
    body: "Nothing is sent to a client automatically.",
  },
  {
    title: "Figures can’t drift from your notes.",
    body: "On NZS 4306 reports, any figure in a finding’s write-up, and every moisture reading, must match a number you entered, or Rondva falls back to your own words.",
  },
];

export function WhereAiStops() {
  return (
    <section className="rv-blueprint rv-grain relative px-6 py-24 text-paper md:py-32">
      <div className="relative mx-auto max-w-[1180px]">
        <div className="flex items-start gap-5">
          <IconShield className="mt-1 hidden h-9 w-9 shrink-0 text-blue sm:block" />
          <SectionHeading eyebrow="Where the AI stops" light>
            This matters more than any feature, <em className="text-paper/70">so we&apos;ll be direct about it.</em>
          </SectionHeading>
        </div>
        <ol className="mt-14 grid gap-x-12 gap-y-10 md:grid-cols-2">
          {whereAiStops.map((item, i) => (
            <li
              key={item.title}
              className={`rv-reveal border-t border-paper/15 pt-6 ${i === whereAiStops.length - 1 && whereAiStops.length % 2 === 1 ? "md:col-span-2" : ""}`}
              style={{ "--i": i } as React.CSSProperties}
            >
              <span className="rv-tnum text-xs font-semibold tracking-[0.14em] text-blue">0{i + 1}</span>
              <p className="mt-3 font-serif text-[24px] font-semibold leading-snug tracking-tight">{item.title}</p>
              <p className="mt-2 text-lg leading-relaxed text-paper/70">{item.body}</p>
            </li>
          ))}
        </ol>
      </div>
  </section>
  );
}
