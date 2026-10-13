"use client";

import { useCallback, useEffect, useState } from "react";

export type PanelSide = "left" | "right";

export type PanelBounds = { defaultWidth: number; minWidth: number; maxWidth: number };

type SavedPanel = { width: number; side: PanelSide };

export function clampWidth(width: number, { minWidth, maxWidth }: PanelBounds) {
  return Math.round(Math.min(maxWidth, Math.max(minWidth, width)));
}

// A side panel's width and docked side, remembered per browser under `key`
// (like useCollapsed — widths depend on the screen, so they stay local).
export function usePanelLayout(key: string, defaultSide: PanelSide, bounds: PanelBounds) {
  const [panel, setPanel] = useState<SavedPanel>(() => {
    const fallback = { width: bounds.defaultWidth, side: defaultSide };
    try {
      const saved = JSON.parse(window.localStorage.getItem(key) ?? "null") as Partial<SavedPanel> | null;
      return {
        width: typeof saved?.width === "number" ? clampWidth(saved.width, bounds) : fallback.width,
        side: saved?.side === "left" || saved?.side === "right" ? saved.side : fallback.side,
      };
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(panel));
    } catch {
      // Storage unavailable (private mode etc.) — layout just won't persist.
    }
  }, [key, panel]);

  const { defaultWidth, minWidth, maxWidth } = bounds;
  const setWidth = useCallback(
    (width: number) => setPanel((p) => ({ ...p, width: clampWidth(width, { defaultWidth, minWidth, maxWidth }) })),
    [defaultWidth, minWidth, maxWidth],
  );
  const setSide = useCallback((side: PanelSide) => setPanel((p) => ({ ...p, side })), []);
  const resetWidth = useCallback(() => setPanel((p) => ({ ...p, width: defaultWidth })), [defaultWidth]);

  return { ...panel, bounds, setWidth, setSide, resetWidth };
}
