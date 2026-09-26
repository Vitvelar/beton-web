"use client";

// Kynningarmynd Rondva í hetjuhlutanum (15 s, 60 fps, hljóðlaus, lykkja). Myndin situr
// VIÐ HLIÐ fyrirsagnarinnar á breiðum skjá og UNDIR henni á síma — aldrei yfir texta og
// aldrei með texta yfir sér (sýndarmyndavélin notar allan rammann). Tvær útgáfur af sömu
// mynd, valdar eftir skjá: "wide" (16:9 — hliðardálkur á ≥1024 px og liggjandi skjáir) og
// "mobile" (4:5 — standandi sími/spjaldtölva; kaflaheitin í borða neðst). Frumskrár og
// endurgerð: plan/rondva/hero-film/.
//
// - Spilun hefst þegar myndin er komin í sýn (IntersectionObserver) og stöðvast þegar hún
//   fer úr sýn — á síma, þar sem hún er fyrir neðan textann, byrjar lykkjan því alltaf á
//   byrjuninni þegar skrunað er niður að henni. Ekkert `autoplay`-eigindi: vafrinn má ekki
//   ræsa hana utan skjás.
// - Veggspjaldið (merkið, rammi 0) liggur ALLTAF undir myndbandinu. Myndbandið byrjar á
//   ramma 0 — engin tímasetning (seek) — og birtist ekki fyrr en það spilar, svo hvergi sést
//   svartur flötur. (iOS sækir engin gögn í myndband í hléi: eldri útgáfa beið eftir `seeked`
//   sem kom aldrei.) `muted` er sett sem eigind, iOS krefst þess fyrir spilun án snertingar.
// - Hindruð spilun (orkusparnaður, bakgrunnsflipi): veggspjaldið stendur; play() er kallað
//   beint í næstu snertingu/smelli/lyklaborði og þegar síðan sést aftur.
// - Hnappur til að gera hlé/spila (WCAG 2.2.2). Val notandans heldur, líka við skrun.
// - Þjónninn velur mynd eftir media (<picture>): sími sækir aldrei breiða veggspjaldið og
//   prefers-reduced-motion fær kyrrmyndina strax, án JavaScript. Þá er myndbandið aldrei sótt.
// - Ef útgáfan hættir að passa (snúningur, gluggi stækkaður) er niðurhali myndbandsins hætt.
// - Myndin situr á blekmottu með mjúkum jöðrum (.rv-film-matte): 48 px teikniblaðsnet
//   kaflans fjarar út áður en eigið net myndarinnar tekur við, svo netin lendi aldrei tvöfalt.
import { useEffect, useRef, useState } from "react";

const BASE = "/rondva/hero";
const BLANK = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
const REDUCE = "(prefers-reduced-motion: reduce)";

// Sömu skilyrði og .rv-film-wide / .rv-film-mobile í rondva.css.
export const WIDE_MEDIA = "(orientation: landscape), (min-width: 1024px)";
export const MOBILE_MEDIA = "(orientation: portrait) and (max-width: 1023px)";

const VARIANTS = {
  wide: {
    media: WIDE_MEDIA,
    ratio: 16 / 9,
    width: 1920,
    height: 1080,
    poster: "rondva-hero-poster-lockup",
    still: "rondva-hero-reduced-motion",
    // WebM fyrst (2,5 MB á móti 4,2 MB); bæði lykkjuskil innan 4 litastiga.
    sources: [
      { src: "rondva-hero-1080p60.webm", type: "video/webm" },
      { src: "rondva-hero-1080p60.mp4", type: "video/mp4" },
    ],
  },
  mobile: {
    media: MOBILE_MEDIA,
    ratio: 4 / 5,
    width: 1080,
    height: 1350,
    poster: "rondva-hero-mobile-poster-lockup",
    still: "rondva-hero-mobile-reduced-motion",
    // Stærri standandi skjáir (spjaldtölvur) fá 1080×1350 (WebM 2,1 MB / MP4 3,3 MB);
    // símar 720×900 (1,6 MB).
    sources: [
      { src: "rondva-hero-mobile-1080x1350.webm", type: "video/webm", media: "(min-width: 600px)" },
      { src: "rondva-hero-mobile-1080x1350.mp4", type: "video/mp4", media: "(min-width: 600px)" },
      { src: "rondva-hero-mobile-720x900.mp4", type: "video/mp4" },
    ],
  },
} as const;

const ALT =
  "Rondva film: an inspection is set up and walked room by room on a phone, the inspector picks the severity, and Rondva drafts the report — one page per room.";

type Mode = "pending" | "off" | "reduced" | "motion";

function stopDownload(v: HTMLVideoElement) {
  v.pause();
  v.querySelectorAll("source").forEach((s) => s.remove());
  v.removeAttribute("src");
  v.load();
}

export function HeroFilm({ variant, className }: { variant: keyof typeof VARIANTS; className?: string }) {
  const V = VARIANTS[variant];
  const ref = useRef<HTMLVideoElement>(null);
  const userPaused = useRef(false);
  const inView = useRef(false);
  const [mode, setMode] = useState<Mode>("pending");
  const [started, setStarted] = useState(false); // hefur spilað → myndbandið sést
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const fits = window.matchMedia(V.media);
    const reduce = window.matchMedia(REDUCE);
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
    v.muted = true;
    v.defaultMuted = true;
    v.setAttribute("muted", "");
    const tryPlay = () => {
      if (userPaused.current || !inView.current || !v.paused) return;
      v.play()?.catch(() => {
        // Hindrað (orkusparnaður/bakgrunnur): veggspjaldið stendur; reynt aftur hér að neðan.
      });
    };
    const onPlaying = () => {
      setStarted(true);
      setPlaying(true);
    };
    const onPause = () => setPlaying(false);
    // Kallað beint innan snertingar/smells svo WebKit telji það leyfða spilun.
    const onGesture = () => tryPlay();
    const onVisible = () => {
      if (document.visibilityState === "visible") tryPlay();
    };
    v.addEventListener("playing", onPlaying);
    v.addEventListener("pause", onPause);
    window.addEventListener("touchend", onGesture, { passive: true });
    window.addEventListener("click", onGesture);
    window.addEventListener("keydown", onGesture);
    document.addEventListener("visibilitychange", onVisible);

    // Spilar þegar a.m.k. helmingur myndarinnar sést; hlé og aftur á byrjun þegar hún er
    // alveg farin úr sýn, svo hún byrji frá upphafi næst þegar skrunað er að henni.
    let io: IntersectionObserver | undefined;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (entries) => {
          const e = entries[entries.length - 1];
          if (e.intersectionRatio >= 0.5) {
            inView.current = true;
            tryPlay();
          } else if (!e.isIntersecting) {
            inView.current = false;
            if (!v.paused) v.pause();
            // Myndbandið hefur spilað → gögnin eru til staðar; seek er örugg hér.
            if (v.currentTime > 0.5) v.currentTime = 0;
          }
        },
        { threshold: [0, 0.5] }
      );
      io.observe(v);
    } else {
      inView.current = true;
      tryPlay();
    }

    return () => {
      io?.disconnect();
      v.removeEventListener("playing", onPlaying);
      v.removeEventListener("pause", onPause);
      window.removeEventListener("touchend", onGesture);
      window.removeEventListener("click", onGesture);
      window.removeEventListener("keydown", onGesture);
      document.removeEventListener("visibilitychange", onVisible);
      // Myndbandið er farið úr DOM (snúningur, reduced motion): hættum niðurhali þess.
      if (!v.isConnected) stopDownload(v);
      inView.current = false;
      setStarted(false);
      setPlaying(false);
    };
  }, [mode]);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      userPaused.current = false;
      v.play()?.catch(() => {});
    } else {
      userPaused.current = true;
      v.pause();
    }
  };

  const style = { "--ar": V.ratio } as React.CSSProperties;
  return (
    <div className={`rv-film rv-film-${variant} ${className ?? ""}`} style={style}>
      <div className="rv-film-matte" aria-hidden="true" />
      <picture>
        {/* media-skilyrðin: rétt útgáfa, og kyrrmynd fyrir reduced motion áður en JS keyrir */}
        <source media={`${V.media} and ${REDUCE}`} srcSet={`${BASE}/${V.still}.webp`} type="image/webp" />
        <source media={`${V.media} and ${REDUCE}`} srcSet={`${BASE}/${V.still}.jpg`} />
        <source media={V.media} srcSet={`${BASE}/${V.poster}.webp`} type="image/webp" />
        <source media={V.media} srcSet={`${BASE}/${V.poster}.jpg`} />
        <img
          src={BLANK}
          alt={mode === "motion" ? "" : ALT}
          aria-hidden={mode === "motion" ? true : undefined}
          width={V.width}
          height={V.height}
          fetchPriority="high"
          decoding="async"
          className="rv-film-media"
        />
      </picture>
      {mode === "motion" ? (
        <>
          <video
            ref={ref}
            className="rv-film-media rv-film-video"
            data-started={started ? "true" : "false"}
            muted
            loop
            playsInline
            preload="auto"
            disablePictureInPicture
            disableRemotePlayback
            width={V.width}
            height={V.height}
            aria-label={ALT}
          >
            {V.sources.map((s) => (
              <source key={s.src} src={`${BASE}/${s.src}`} type={s.type} media={"media" in s ? s.media : undefined} />
            ))}
          </video>
          <button
            type="button"
            onClick={toggle}
            className="rv-film-toggle"
            aria-label={playing ? "Pause film" : "Play film"}
          >
            {playing ? (
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="currentColor">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="currentColor">
                <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
              </svg>
            )}
          </button>
        </>
      ) : null}
    </div>
  );
}
