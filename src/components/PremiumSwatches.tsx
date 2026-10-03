"use client";

import { useRouter } from "next/navigation";
import { SettingsIcon } from "@/components/settings/SettingsIcon";
import { PREMIUM_THEMES, useTheme } from "@/lib/theme/theme-context";
import { useWallet } from "@/lib/wallet/wallet-context";

// Premium theme swatches. Owned themes apply on click; locked ones open the
// marketplace with that theme highlighted.
export function PremiumSwatches() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { ownsTheme } = useWallet();

  return (
    <div className="theme-swatches">
      {PREMIUM_THEMES.map((t) => {
        const owned = ownsTheme(t.id);
        return (
          <button
            key={t.id}
            type="button"
            className={`swatch${theme === t.id ? " active" : ""}${owned ? "" : " is-locked"}`}
            data-t={t.id}
            title={owned ? t.title : `${t.title} (locked: view in marketplace)`}
            aria-label={owned ? t.title : `${t.title}, locked. View in marketplace`}
            onClick={() =>
              owned ? setTheme(t.id) : router.push(`/marketplace?theme=${t.id}`)
            }
          >
            {!owned && (
              <span className="swatch-lock">
                <SettingsIcon name="lock" size={9} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
