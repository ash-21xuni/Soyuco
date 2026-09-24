"use client";

import { useCallback, useEffect, useState } from "react";

// A collapsed/expanded flag remembered per browser under `key`.
export function useCollapsed(key: string) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return window.localStorage.getItem(key) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, collapsed ? "1" : "0");
    } catch {
      // Storage unavailable (private mode etc.) — state just won't persist.
    }
  }, [key, collapsed]);

  const toggle = useCallback(() => setCollapsed((c) => !c), []);
  return [collapsed, toggle, setCollapsed] as const;
}
