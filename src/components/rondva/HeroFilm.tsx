"use client";

// Kynningarmynd Rondva í hero (15 s, 1920×1080, 60 fps, hljóðlaus, lykkja).
// Frumskrár og endurgerð: plan/rondva/hero-film/.
//
// - Þjónninn birtir veggspjaldið (ramma 165, t = 2,75 s). Myndbandið festist
//   aðeins í DOM þegar vafrinn leyfir hreyfingu og byrjar á sama ramma, svo
//   skiptin frá veggspjaldi yfir í hreyfingu sjást ekki. Lykkjan lokast á
//   kyrru merki (rammi 899 ≡ rammi 0).
// - prefers-reduced-motion: kyrrmynd af skýrslusíðunum; myndbandið er aldrei sótt.
// - Myndin situr á blekmottu með mjúkum 64 px jöðrum: 48 px teikniblaðsnet kaflans
//   fjarar út áður en eigið net myndarinnar fjarar inn, svo netin lendi aldrei tvöfalt.
import { useEffect, useRef, useState } from "react";

const BASE = "/rondva/hero";
const START_AT = 2.75; // sekúndur — sami rammi og rondva-hero-poster-product.*

const MATTE_MASK =
  "linear-gradient(to right, transparent, #000 64px, #000 calc(100% - 64px), transparent), " +
  "linear-gradient(to bottom, transparent, #000 64px, #000 calc(100% - 64px), transparent)";
const MATTE_STYLE = { maskImage: MATTE_MASK, WebkitMaskImage: MATTE_MASK, maskComposite: "intersect", WebkitMaskComposite: "source-in" } as const;

const POSTER_ALT =
  "Rondva: a phone with the rooms of a flat next to a drafted floor plan rising into 3D.";

type Mode = "pending" | "reduced" | "motion";

export function HeroFilm({ className }: { className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [mode, setMode] = useState<Mode>("pending");

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setMode(mq.matches ? "reduced" : "motion");
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

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

  return (
    <div className={`relative isolate ${className ?? ""}`}>
      <div aria-hidden="true" className="pointer-events-none absolute -inset-16 -z-10 bg-ink" style={MATTE_STYLE} />
      {mode === "motion" ? (
        <video
          ref={ref}
          className="block aspect-video h-auto w-full"
          muted
          loop
          playsInline
          preload="auto"
          poster={`${BASE}/rondva-hero-poster-product.webp`}
          width={1920}
          height={1080}
          aria-label="Rondva in 15 seconds: set up the property, walk and record, the inspector picks the severity, Rondva drafts the report around the inspector's notes, review and export."
        >
          {/* WebM fyrst (2,5 MB á móti 4,2 MB); bæði lykkjuskil innan 4 litastiga. Símar fá 720p. */}
          <source src={`${BASE}/rondva-hero-1080p60.webm`} type="video/webm" media="(min-width: 768px)" />
          <source src={`${BASE}/rondva-hero-1080p60.mp4`} type="video/mp4" media="(min-width: 768px)" />
          <source src={`${BASE}/rondva-hero-720p60.mp4`} type="video/mp4" />
        </video>
      ) : (
        <picture>
          <source
            srcSet={mode === "reduced" ? `${BASE}/rondva-hero-reduced-motion.webp` : `${BASE}/rondva-hero-poster-product.webp`}
            type="image/webp"
          />
          <img
            src={mode === "reduced" ? `${BASE}/rondva-hero-reduced-motion.jpg` : `${BASE}/rondva-hero-poster-product.jpg`}
            alt={
              mode === "reduced"
                ? "Four report pages from a Rondva inspection, one per room, each with a severity label and the inspector's company name."
                : POSTER_ALT
            }
            width={1920}
            height={1080}
            fetchPriority="high"
            className="block aspect-video h-auto w-full"
          />
        </picture>
      )}
    </div>
  );
}
