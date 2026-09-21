"use client";

import { useEffect, useRef } from "react";

// Setur data-shown="true" á hvert .rv-reveal barn þegar það kemur í sýn.
// Eitt observer fyrir alla síðuna; skilar sér sem hreinn CSS-transition.
export function RevealObserver() {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(".rv-reveal"));
    if (!("IntersectionObserver" in window)) {
      nodes.forEach((n) => n.setAttribute("data-shown", "true"));
      return;
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
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);
  return null;
}
