"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { SplashScreen } from "./SplashScreen";

type SplashContextValue = {
  hold: () => void;
  release: () => void;
};

const SplashContext = createContext<SplashContextValue | undefined>(undefined);

// Longest we wait for fonts/images on first load before revealing the page anyway.
const BOOT_TIMEOUT_MS = 5000;

// Owns the single splash overlay. It is visible on the first page load (so the
// server-rendered HTML starts covered) and afterwards whenever any component
// holds it via useSplash(). Living in the root layout means it survives route
// changes, e.g. login -> journal, without replaying its entrance.
export function SplashProvider({ children }: { children: ReactNode }) {
  const [booting, setBooting] = useState(true);
  const [holds, setHolds] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const done = () => {
      if (!cancelled) setBooting(false);
    };

    const pageLoaded =
      document.readyState === "complete"
        ? Promise.resolve()
        : new Promise<void>((resolve) =>
            window.addEventListener("load", () => resolve(), { once: true }),
          );
    Promise.all([pageLoaded, document.fonts?.ready]).then(done, done);
    const timer = setTimeout(done, BOOT_TIMEOUT_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  const value = useMemo<SplashContextValue>(
    () => ({
      hold: () => setHolds((n) => n + 1),
      release: () => setHolds((n) => Math.max(0, n - 1)),
    }),
    [],
  );

  return (
    <SplashContext.Provider value={value}>
      {children}
      <SplashScreen active={booting || holds > 0} />
    </SplashContext.Provider>
  );
}

// Keeps the splash on screen for as long as `active` is true.
export function useSplash(active: boolean) {
  const ctx = useContext(SplashContext);
  if (!ctx) throw new Error("useSplash must be used within a SplashProvider");
  const { hold, release } = ctx;

  useEffect(() => {
    if (!active) return;
    hold();
    return release;
  }, [active, hold, release]);
}
