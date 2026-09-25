"use client";

// Kynningarmynd Rondva í hero (15 s, 60 fps, hljóðlaus, lykkja). Tvær útgáfur af
// sömu mynd: "wide" (16:9, spjaldtölva og stærra) og "portrait" (4:5 fyrir síma —
// sýndarmyndavél rammar hvert skot upp á nýtt og kaflaheitin eru í borða neðst).
// Frumskrár og endurgerð: plan/rondva/hero-film/.
//
// - Þjónninn birtir veggspjaldið (ramma 165, t = 2,75 s) aðeins fyrir þá útgáfu sem
//   passar við skjáinn (<picture> með media), svo hin sækist aldrei. Myndbandið
//   festist aðeins þegar útgáfan passar og hreyfing er leyfð, og byrjar á sama ramma
//   og veggspjaldið. Lykkjan lokast á kyrru merki (rammi 899 ≡ rammi 0).
// - prefers-reduced-motion: kyrrmynd af skýrslusíðunum; myndbandið er aldrei sótt.
// - Myndin situr á blekmottu með mjúkum 64 px jöðrum: 48 px teikniblaðsnet kaflans
//   fjarar út áður en eigið net myndarinnar fjarar inn, svo netin lendi aldrei tvöfalt.
import { useEffect, useRef, useState } from "react";

const BASE = "/rondva/hero";
const START_AT = 2.75; // sekúndur — sami rammi og veggspjöldin
const BLANK = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

const VARIANTS = {
  wide: {
    media: "(min-width: 768px)",
    aspect: "aspect-video",
    width: 1920,
    height: 1080,
    poster: "rondva-hero-poster-product",
    still: "rondva-hero-reduced-motion",
    // WebM fyrst (2,5 MB á móti 4,2 MB); bæði lykkjuskil innan 4 litastiga.
    sources: [
      { src: "rondva-hero-1080p60.webm", type: "video/webm" },
      { src: "rondva-hero-1080p60.mp4", type: "video/mp4" },
    ],
  },
  portrait: {
    media: "(max-width: 767px)",
    aspect: "aspect-[4/5]",
    width: 1080,
    height: 1350,
    poster: "rondva-hero-mobile-poster",
    still: "rondva-hero-mobile-reduced-motion",
    sources: [{ src: "rondva-hero-mobile-720x900.mp4", type: "video/mp4" }], // 1,6 MB
  },
} as const;

const MATTE_MASK =
  "linear-gradient(to right, transparent, #000 64px, #000 calc(100% - 64px), transparent), " +
  "linear-gradient(to bottom, transparent, #000 64px, #000 calc(100% - 64px), transparent)";
const MATTE_STYLE = { maskImage: MATTE_MASK, WebkitMaskImage: MATTE_MASK, maskComposite: "intersect", WebkitMaskComposite: "source-in" } as const;

const POSTER_ALT = "Rondva: a phone with the rooms of a flat next to a drafted floor plan rising into 3D.";
const STILL_ALT =
  "Four report pages from a Rondva inspection, one per room, each with a severity label and the inspector's company name.";

type Mode = "pending" | "off" | "reduced" | "motion";

export function HeroFilm({ variant = "wide", className }: { variant?: keyof typeof VARIANTS; className?: string }) {
  const V = VARIANTS[variant];
  const ref = useRef<HTMLVideoElement>(null);
  const [mode, setMode] = useState<Mode>("pending");

  useEffect(() => {
    const fits = window.matchMedia(V.media);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setMode(!fits.matches ? "off" : reduce.matches ? "reduced" : "motion");
    update();
    fits.addEventListener("change", update);
    reduce.addEventListener("change", update);
    return () => {
      fits.removeEventListener("change", update);
      reduce.removeEventListener("change", update);
    };
  }, [V.media]);

  useEffect(() => {
    const v = ref.current;
    if (!v || mode !== "motion") return;
    let started = false;
    const play = () => void v.play().catch(() => {});
    const start = () => {
      if (started) return;
      started = true;
      v.addEventListener("seeked", play, { once: true });
      v.currentTime = START_AT;
    };
    if (v.readyState >= 1) start();
    else v.addEventListener("loadedmetadata", start, { once: true });
    // Vafrar gera hlé á myndböndum í bakgrunnsflipa; höldum áfram þegar síðan sést aftur.
    const onVisible = () => {
      if (document.visibilityState === "visible" && started && v.paused) play();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      v.removeEventListener("loadedmetadata", start);
      v.removeEventListener("seeked", play);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [mode]);

  const image = mode === "reduced" ? V.still : V.poster;
  return (
    <div className={`relative isolate ${className ?? ""}`}>
      <div aria-hidden="true" className="pointer-events-none absolute -inset-16 -z-10 bg-ink" style={MATTE_STYLE} />
      {mode === "motion" ? (
        <video
          ref={ref}
          className={`block h-auto w-full ${V.aspect}`}
          muted
          loop
          playsInline
          preload="auto"
          poster={`${BASE}/${V.poster}.webp`}
          width={V.width}
          height={V.height}
          aria-label="Rondva in 15 seconds: set up the property, walk and record, the inspector picks the severity, Rondva drafts the report around the inspector's notes, review and export."
        >
          {V.sources.map((s) => (
            <source key={s.src} src={`${BASE}/${s.src}`} type={s.type} />
          ))}
        </video>
      ) : (
        <picture>
          {/* media-skilyrðin tryggja að sími sæki aldrei breiða veggspjaldið og öfugt */}
          <source media={V.media} srcSet={`${BASE}/${image}.webp`} type="image/webp" />
          <source media={V.media} srcSet={`${BASE}/${image}.jpg`} />
          <img
            src={BLANK}
            alt={mode === "reduced" ? STILL_ALT : POSTER_ALT}
            width={V.width}
            height={V.height}
            className={`block h-auto w-full ${V.aspect}`}
          />
        </picture>
      )}
    </div>
  );
}
