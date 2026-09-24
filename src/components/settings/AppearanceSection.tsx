"use client";

import { PREMIUM_THEMES, THEMES, useTheme, type ThemeId } from "@/lib/theme/theme-context";
import { useToast } from "@/lib/toast/toast-context";
import { SettingsCardTitle, SettingsIcon } from "@/components/settings/SettingsIcon";

export function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();

  return (
    <div className="planner-card">
      <div className="planner-card-header">
        <SettingsCardTitle icon="palette">Appearance</SettingsCardTitle>
      </div>
      <div className="planner-card-body">
        <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.72rem", color: "var(--text3)", marginBottom: 10 }}>
          Theme
        </div>
        <div className="theme-swatches">
          {THEMES.map((t) => (
            <div
              key={t.id}
              className={`swatch${theme === t.id ? " active" : ""}`}
              data-t={t.id}
              title={t.title}
              onClick={() => setTheme(t.id as ThemeId)}
            />
          ))}
        </div>

        <div className="premium-label" style={{ marginTop: 16 }}>
          <span className="premium-crown"><SettingsIcon name="crown" size={13} /></span> Premium
          <span className="premium-badge">PRO</span>
        </div>
        <div className="theme-swatches">
          {PREMIUM_THEMES.map((t) => (
            <div
              key={t.id}
              className={`swatch${theme === t.id ? " active" : ""}`}
              data-t={t.id}
              title={t.title}
              onClick={() => setTheme(t.id as ThemeId)}
            />
          ))}
        </div>

        <button
          className="custom-theme-btn"
          onClick={() => showToast("Theme customization is coming soon.", "info")}
        >
          <SettingsIcon name="sparkles" size={14} /> Customize Theme
        </button>
      </div>
    </div>
  );
}
