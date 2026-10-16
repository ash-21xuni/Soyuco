"use client";

import { useState } from "react";
import { CURRENCIES, currencySymbol, saveCurrency, useCurrency, type CurrencyCode } from "@/lib/budget/currency";
import { useToast } from "@/lib/toast/toast-context";
import { SettingsCardTitle } from "@/components/settings/SettingsIcon";

export function CurrencySection() {
  const { code, money } = useCurrency();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  async function change(next: CurrencyCode) {
    setSaving(true);
    const { error } = await saveCurrency(next);
    setSaving(false);
    if (error) showToast(`Couldn't change currency: ${error.message}`, "error");
    else showToast(`Currency set to ${next}.`, "success");
  }

  return (
    <div className="planner-card">
      <div className="planner-card-header">
        <SettingsCardTitle icon="wallet">Currency</SettingsCardTitle>
      </div>
      <div className="planner-card-body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.72rem", color: "var(--text3)" }}>
          Used across the Budget Planner. Changing it only changes the symbol shown; amounts aren&apos;t converted.
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <select
            value={code}
            disabled={saving}
            onChange={(e) => change(e.target.value as CurrencyCode)}
            aria-label="Currency"
            style={{
              padding: "8px 12px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              fontFamily: "var(--font-ui)",
              fontSize: "0.85rem",
              color: "var(--text)",
              minWidth: 240,
            }}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} · {c.name} ({currencySymbol(c.code)})
              </option>
            ))}
          </select>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text3)" }}>
            e.g. {money(1234.5)}
          </span>
        </div>
      </div>
    </div>
  );
}
