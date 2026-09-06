"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const THEMES = [
  { id: "default", title: "Ember" },
  { id: "parchment", title: "Parchment" },
  { id: "ocean", title: "Ocean" },
  { id: "forest", title: "Forest" },
  { id: "rose", title: "Rose" },
  { id: "terminal", title: "Terminal" },
  { id: "lavender", title: "Lavender" },
] as const;

export const PREMIUM_THEMES = [
  { id: "spongebob", title: "SpongeBob 🧽" },
  { id: "meangirls", title: "Mean Girls 💅" },
  { id: "minecraft", title: "Minecraft ⛏" },
] as const;

export type ThemeId =
  | (typeof THEMES)[number]["id"]
  | (typeof PREMIUM_THEMES)[number]["id"];

const STORAGE_KEY = "soyuco_theme";

type ThemeContextValue = {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function readStoredTheme(): ThemeId {
  if (typeof window === "undefined") return "default";
  return (window.localStorage.getItem(STORAGE_KEY) as ThemeId | null) ?? "default";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(readStoredTheme);

  useEffect(() => {
    document.body.dataset.theme = theme;
    return () => {
      delete document.body.dataset.theme;
    };
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme(next) {
        setThemeState(next);
        window.localStorage.setItem(STORAGE_KEY, next);
      },
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
