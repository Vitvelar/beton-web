"use client";

import { useEffect } from "react";

// Skrunbirting á efni neðan við brotið. Án JavaScript sést allt efni strax: fyrst hér er <html>
// merkt data-rv-ready (þá fela CSS-reglurnar .rv-reveal þar til það kemur í sýn). Efni sem er
// þegar í sýn er aldrei falið. Eitt observer fyrir alla síðuna.
export function RevealObserver() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(".rv-reveal"));
    const root = document.documentElement;
    const viewportBottom = window.innerHeight;

    if (!("IntersectionObserver" in window)) {
      nodes.forEach((n) => n.setAttribute("data-shown", "true"));
      return;
    }

    // Það sem er þegar á skjánum blikkar ekki: merkt sýnt áður en falið er.
    const below: HTMLElement[] = [];
    for (const n of nodes) {
      if (n.getBoundingClientRect().top < viewportBottom) n.setAttribute("data-shown", "true");
      else below.push(n);
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).setAttribute("data-shown", "true");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
    );
    below.forEach((n) => io.observe(n));
    root.setAttribute("data-rv-ready", "");
    return () => {
      io.disconnect();
      root.removeAttribute("data-rv-ready");
    };
  }, []);
  return null;
}
