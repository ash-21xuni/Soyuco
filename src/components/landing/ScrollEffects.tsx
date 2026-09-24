"use client";

import { useEffect } from "react";

// Drives the landing page's scroll effects: reveal-on-scroll for [data-reveal]
// elements, the condensed header, the progress bar, and hero parallax.
// Elements stay visible without JS; hiding only kicks in once .lp-js is set.
export function ScrollEffects() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".landing-page");
    if (!root) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const targets = root.querySelectorAll<HTMLElement>("[data-reveal]");

    let observer: IntersectionObserver | undefined;
    if (!reduceMotion) {
      root.classList.add("lp-js");
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer?.unobserve(entry.target);
            }
          }
        },
        { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
      );
      targets.forEach((el) => observer!.observe(el));
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      root.classList.toggle("lp-scrolled", y > 24);
      root.style.setProperty("--lp-progress", String(max > 0 ? y / max : 0));
      if (!reduceMotion) root.style.setProperty("--lp-parallax", `${Math.min(y, 900) * 0.08}px`);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      observer?.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
      root.classList.remove("lp-js", "lp-scrolled");
    };
  }, []);

  return null;
}
