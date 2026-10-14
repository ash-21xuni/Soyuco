"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/lib/supabase/auth-context";
import { supabase } from "@/lib/supabase/client";
import { isPremiumTheme, useTheme, type ThemeId } from "@/lib/theme/theme-context";

// Soyucoins balance and unlocked premium themes. The app can only read these;
// every change goes through the database (unlock_theme) or the server
// (/api/coins/checkout), which enforce prices and balances.
// See supabase/sql/soyucoins.sql.

type Result = { ok: true } | { ok: false; error: string };

type WalletContextValue = {
  balance: number;
  ownedThemes: ThemeId[];
  /** False until the first load from the server finishes. */
  loaded: boolean;
  buyCoins: (packId: string) => Promise<Result>;
  buyTheme: (themeId: ThemeId) => Promise<Result>;
  ownsTheme: (themeId: ThemeId) => boolean;
  /** The "Buy Soyucoins" popup, opened from the account menu or the marketplace. */
  buyCoinsOpen: boolean;
  setBuyCoinsOpen: (open: boolean) => void;
};

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [balance, setBalance] = useState(0);
  const [ownedThemes, setOwnedThemes] = useState<ThemeId[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [buyCoinsOpen, setBuyCoinsOpen] = useState(false);
  const { savedTheme, setTheme } = useTheme();

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    Promise.all([
      supabase.from("wallets").select("balance").eq("user_id", userId).maybeSingle(),
      supabase.from("owned_themes").select("theme_id").eq("user_id", userId),
    ]).then(([wallet, themes]) => {
      if (cancelled) return;
      if (wallet.error) console.error("Failed to load Soyucoins:", wallet.error.message);
      if (themes.error) console.error("Failed to load owned themes:", themes.error.message);
      setBalance(wallet.data?.balance ?? 0);
      setOwnedThemes((themes.data ?? []).map((t) => t.theme_id as ThemeId));
      setLoadFailed(Boolean(wallet.error || themes.error));
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // A premium theme saved before it was bought (or on another account) falls
  // back to the default. Skipped if loading failed, so an outage doesn't
  // strip someone's paid theme.
  useEffect(() => {
    if (loaded && !loadFailed && isPremiumTheme(savedTheme) && !ownedThemes.includes(savedTheme)) {
      setTheme("default");
    }
  }, [loaded, loadFailed, savedTheme, ownedThemes, setTheme]);

  const buyCoins = useCallback(async (packId: string): Promise<Result> => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return { ok: false, error: "Please sign in again." };

    try {
      const res = await fetch("/api/coins/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ packId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, error: body.error ?? "Purchase failed." };
      setBalance(body.balance);
      return { ok: true };
    } catch {
      return { ok: false, error: "Couldn't reach the server. Check your connection." };
    }
  }, []);

  const buyTheme = useCallback(async (themeId: ThemeId): Promise<Result> => {
    const { data, error } = await supabase.rpc("unlock_theme", { p_theme_id: themeId });
    if (error) return { ok: false, error: error.message };
    setBalance(data as number);
    setOwnedThemes((owned) => [...owned, themeId]);
    return { ok: true };
  }, []);

  const value = useMemo<WalletContextValue>(
    () => ({
      balance,
      ownedThemes,
      loaded,
      buyCoins,
      buyTheme,
      ownsTheme: (themeId) => ownedThemes.includes(themeId),
      buyCoinsOpen,
      setBuyCoinsOpen,
    }),
    [balance, ownedThemes, loaded, buyCoins, buyTheme, buyCoinsOpen],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within a WalletProvider");
  return ctx;
}
