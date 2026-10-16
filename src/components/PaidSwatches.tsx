"use client";

import { useRouter } from "next/navigation";
import { SettingsIcon } from "@/components/settings/SettingsIcon";
import { isProTheme } from "@/lib/marketplace/catalog";
import { PREMIUM_THEMES, useTheme } from "@/lib/theme/theme-context";
import { useWallet } from "@/lib/wallet/wallet-context";

// Swatches for themes that are bought: the regular ones (shown alongside the
// free themes) or the Premium/Pro ones. No wrapper, so they can share a row
// with other swatches. Owned themes apply on click; locked ones open the
// marketplace with that theme highlighted.
export function PaidSwatches({ group }: { group: "regular" | "pro" }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { ownsTheme } = useWallet();
  const themes = PREMIUM_THEMES.filter((t) => isProTheme(t.id) === (group === "pro"));

  return themes.map((t) => {
    const owned = ownsTheme(t.id);
    return (
      <button
        key={t.id}
        type="button"
        className={`swatch${theme === t.id ? " active" : ""}${owned ? "" : " is-locked"}`}
        data-t={t.id}
        title={owned ? t.title : `${t.title} (locked: view in marketplace)`}
        aria-label={owned ? t.title : `${t.title}, locked. View in marketplace`}
        onClick={() => (owned ? setTheme(t.id) : router.push(`/marketplace?theme=${t.id}`))}
      >
        {!owned && (
          <span className="swatch-lock">
            <SettingsIcon name="lock" size={9} />
          </span>
        )}
      </button>
    );
  });
}
