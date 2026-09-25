"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/supabase/auth-context";
import { useJournal } from "@/lib/journal/journal-context";
import { useToast } from "@/lib/toast/toast-context";
import { displayName } from "@/lib/supabase/display-name";
import { SettingsIcon } from "@/components/settings/SettingsIcon";

const TITLES: Record<string, string> = {
  "/journal": "Journal",
  "/planner": "Day Planner",
  "/ai": "AI Day Planner",
  "/budget": "Budget Planner",
  "/marketplace": "Marketplace",
};

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { createEntry } = useJournal();
  const { showToast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const areaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (areaRef.current && !areaRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  async function handleSignOut() {
    await signOut();
    showToast("Signed out. Your data remains in the cloud.");
    router.push("/login");
  }

  return (
    <div id="topbar">
      <div className="topbar-title">{TITLES[pathname] ?? "Soyuco"}</div>
      <button
        className={`btn btn-ghost${pathname === "/marketplace" ? " active" : ""}`}
        aria-current={pathname === "/marketplace" ? "page" : undefined}
        onClick={() => router.push("/marketplace")}
        style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px" }}
      >
        <SettingsIcon name="shoppingBag" size={15} />
        <span style={{ fontSize: "0.8rem" }}>Marketplace</span>
      </button>
      <div style={{ position: "relative" }} ref={areaRef}>
        <button
          className="btn btn-ghost"
          onClick={() => setMenuOpen((v) => !v)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px" }}
        >
          <span
            style={{
              width: 22,
              height: 22,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--accent)",
              color: "var(--bg)",
              borderRadius: "50%",
            }}
          >
            <SettingsIcon name="user" size={14} />
          </span>
          <span style={{ fontSize: "0.8rem" }}>{displayName(user) || "..."}</span>
          <SettingsIcon name="chevronDown" size={14} />
        </button>
        {menuOpen && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              minWidth: 220,
              maxWidth: "min(340px, calc(100vw - 32px))",
              background: "var(--bg2)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-lg)",
              zIndex: 200,
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.65rem", color: "var(--text3)" }}>
                Signed in as
              </div>
              {displayName(user) !== user?.email?.split("@")[0] && (
                <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.8rem", color: "var(--text)", marginTop: 4 }}>
                  {displayName(user)}
                </div>
              )}
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.7rem",
                  color: "var(--text)",
                  marginTop: 4,
                  overflowWrap: "anywhere",
                }}
              >
                {user?.email}
              </div>
            </div>
            <button
              onClick={() => {
                setMenuOpen(false);
                router.push("/settings");
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                textAlign: "left",
                padding: "10px 12px",
                fontFamily: "var(--font-ui)",
                fontSize: "0.75rem",
                color: "var(--text2)",
                background: "none",
                border: "none",
                borderBottom: "1px solid var(--border)",
                cursor: "pointer",
              }}
            >
              <SettingsIcon name="settings" size={14} /> Account Settings
            </button>
            <button
              onClick={handleSignOut}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                textAlign: "left",
                padding: "10px 12px",
                fontFamily: "var(--font-ui)",
                fontSize: "0.75rem",
                color: "var(--danger)",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              <SettingsIcon name="logOut" size={14} /> Sign Out
            </button>
          </div>
        )}
      </div>
      {pathname === "/journal" && (
        <button className="btn btn-primary" style={{ padding: "5px 12px" }} onClick={() => createEntry()}>
          ✦ New Entry
        </button>
      )}
    </div>
  );
}
