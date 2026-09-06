"use client";

import { useState } from "react";
import { useTheme } from "@/lib/theme/theme-context";
import { THEME_COPY, quotePoolForTheme } from "@/lib/theme/theme-copy";

export function DailyQuote() {
  const { theme } = useTheme();
  const copy = THEME_COPY[theme];
  const [quoteIdx, setQuoteIdx] = useState(0);

  const pool = quotePoolForTheme(theme);
  const quote = pool[quoteIdx % pool.length];

  return (
    <div className="planner-card">
      <div className="planner-card-header">
        <div className="planner-card-title">{copy.quote}</div>
        <button
          className="btn btn-ghost"
          style={{ fontSize: "0.68rem", padding: "3px 8px" }}
          onClick={() => setQuoteIdx((i) => i + 1)}
        >
          ↻
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
