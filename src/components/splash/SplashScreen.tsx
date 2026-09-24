"use client";

import { useEffect, useRef, useState } from "react";
import "./splash.css";

type Phase = "visible" | "exiting" | "hidden";

// Long enough for the pop-in plus one throb, so it never just flickers.
const MIN_VISIBLE_MS = 1100;
// Matches the .splash-exiting animation duration in splash.css.
const EXIT_MS = 500;

export function SplashScreen({ active }: { active: boolean }) {
  const [phase, setPhase] = useState<Phase>("visible");
  const [showId, setShowId] = useState(0);
  const [wasActive, setWasActive] = useState(active);
  const shownAt = useRef(0);
  const mounted = useRef(false);

  // Re-show (and replay the pop) if something asks for the splash again.
  if (active !== wasActive) {
    setWasActive(active);
    if (active && phase !== "visible") {
      setPhase("visible");
      setShowId((n) => n + 1);
    }
  }

  // The first-load splash counts from navigation start; later ones from now.
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (active) shownAt.current = performance.now();
  }, [active]);

  useEffect(() => {
    if (active || phase !== "visible") return;
    const wait = Math.max(0, MIN_VISIBLE_MS - (performance.now() - shownAt.current));
    const timer = setTimeout(() => setPhase("exiting"), wait);
    return () => clearTimeout(timer);
  }, [active, phase]);

  useEffect(() => {
    if (phase !== "exiting") return;
    const timer = setTimeout(() => setPhase("hidden"), EXIT_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  if (phase === "hidden") return null;

  return (
    <div
      className={`splash${phase === "exiting" ? " splash-exiting" : ""}`}
      role="status"
      aria-live="polite"
      aria-label="Loading Soyuco"
    >
      <noscript>
        <style>{".splash{display:none}"}</style>
      </noscript>
      <div className="splash-orb splash-orb-a" aria-hidden="true" />
      <div className="splash-orb splash-orb-b" aria-hidden="true" />
      <div className="splash-mark" key={showId} aria-hidden="true">
        <div className="splash-throb">
          <span className="splash-ring" />
          <img src="/logo.svg" alt="" className="splash-logo" fetchPriority="high" />
          <span className="splash-name">Soyuco</span>
        </div>
      </div>
    </div>
  );
}
