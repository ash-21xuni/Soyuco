"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CURSOR_EFFECTS, CursorTrail } from "@/components/theme/CursorTrail";

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
  { id: "spongebob", title: "Sunny Reef" },
  { id: "meangirls", title: "Queen Bee" },
  { id: "minecraft", title: "Pixel Quarry" },
  { id: "cyberpunk", title: "Neon District" },
] as const;

export type ThemeId =
  | (typeof THEMES)[number]["id"]
  | (typeof PREMIUM_THEMES)[number]["id"];

const STORAGE_KEY = "soyuco_theme";

type ThemeContextValue = {
  /** The theme on screen: the preview if there is one, otherwise the saved theme. */
  theme: ThemeId;
  /** The theme the user picked, which persists across visits. */
  savedTheme: ThemeId;
  /** A theme being tried on in the marketplace. Never saved. */
  previewing: ThemeId | null;
  setTheme: (theme: ThemeId) => void;
  previewTheme: (theme: ThemeId | null) => void;
};

export function isPremiumTheme(theme: ThemeId) {
  return PREMIUM_THEMES.some((t) => t.id === theme);
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function readStoredTheme(): ThemeId {
  if (typeof window === "undefined") return "default";
  return (window.localStorage.getItem(STORAGE_KEY) as ThemeId | null) ?? "default";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [savedTheme, setThemeState] = useState<ThemeId>(readStoredTheme);
  const [previewing, setPreviewing] = useState<ThemeId | null>(null);
  const theme = previewing ?? savedTheme;

  useEffect(() => {
    document.body.dataset.theme = theme;
    return () => {
      delete document.body.dataset.theme;
    };
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      savedTheme,
      previewing,
      setTheme(next) {
        setThemeState(next);
        setPreviewing(null);
        window.localStorage.setItem(STORAGE_KEY, next);
      },
      previewTheme: setPreviewing,
    }),
    [theme, savedTheme, previewing],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
      {/* Premium themes' cursor effects; marketplace previews get them too. */}
      {CURSOR_EFFECTS[theme] && <CursorTrail key={theme} effect={CURSOR_EFFECTS[theme]} />}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
