"use client";

import { useState } from "react";
import { useTheme } from "@/lib/theme/theme-context";
import { THEME_COPY, quotePoolForTheme } from "@/lib/theme/theme-copy";
import { SettingsCardTitle, SettingsIcon } from "@/components/settings/SettingsIcon";

export function DailyQuote() {
  const { theme } = useTheme();
  const copy = THEME_COPY[theme];
  const [quoteIdx, setQuoteIdx] = useState(0);

  const pool = quotePoolForTheme(theme);
  const quote = pool[quoteIdx % pool.length];

  return (
    <div className="planner-card">
      <div className="planner-card-header">
        <SettingsCardTitle icon="quote">{copy.quote}</SettingsCardTitle>
        <button
          className="btn btn-ghost"
          style={{ fontSize: "0.68rem", padding: "3px 8px" }}
          onClick={() => setQuoteIdx((i) => i + 1)}
          aria-label="Next quote"
          title="Next quote"
        >
          <SettingsIcon name="refresh" size={13} />
        </button>
      </div>
      <div className="planner-card-body">
        <div className="daily-quote">
          &quot;{quote.text}&quot; <cite>— {quote.author}</cite>
        </div>
      </div>
    </div>
  );
}
