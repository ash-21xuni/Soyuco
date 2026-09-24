"use client";

import Link from "next/link";
import { SettingsIcon } from "@/components/settings/SettingsIcon";
import { PREMIUM_THEMES, THEMES, useTheme, type ThemeId } from "@/lib/theme/theme-context";
import { useEscapeToClose } from "@/lib/useEscapeToClose";

// Purchases aren't tracked yet, so every theme the app ships counts as owned.
const GROUPS = [
  { label: "Free", themes: THEMES },
  { label: "Premium", themes: PREMIUM_THEMES },
] as const;

export function OwnedThemesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme, setTheme } = useTheme();
  useEscapeToClose(open, onClose);
  if (!open) return null;

  return (
    <div
      className="owned-themes-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="owned-themes-modal" role="dialog" aria-modal="true" aria-labelledby="owned-themes-title">
        <div className="owned-themes-head">
          <div id="owned-themes-title" className="owned-themes-title">
            Your Themes
          </div>
          <button type="button" className="panel-toggle" onClick={onClose} aria-label="Close">
            <SettingsIcon name="close" />
          </button>
        </div>

        <div className="owned-themes-body">
          {GROUPS.map((group) => (
            <section key={group.label}>
              <div className="owned-themes-group">{group.label}</div>
              <div className="owned-themes-grid">
                {group.themes.map((t) => {
                  const active = theme === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className={`owned-theme${active ? " active" : ""}`}
                      aria-pressed={active}
                      onClick={() => {
                        setTheme(t.id as ThemeId);
                        onClose();
                      }}
                    >
                      <span className="swatch owned-theme-swatch" data-t={t.id} />
                      <span className="owned-theme-name">{t.title}</span>
                      {active && (
                        <span className="owned-theme-check">
                          <SettingsIcon name="check" size={14} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <div className="owned-themes-foot">
          <Link href="/marketplace" className="btn btn-ghost" onClick={onClose}>
            <SettingsIcon name="shoppingBag" size={14} /> Browse marketplace
          </Link>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
