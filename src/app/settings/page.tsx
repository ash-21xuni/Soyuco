"use client";

import Link from "next/link";
import { useState } from "react";
import { ProfileSection } from "@/components/settings/ProfileSection";
import { PasswordSection } from "@/components/settings/PasswordSection";
import { AppearanceSection } from "@/components/settings/AppearanceSection";
import { NotificationsSection } from "@/components/settings/NotificationsSection";
import { DangerZoneSection } from "@/components/settings/DangerZoneSection";
import { HelpSection } from "@/components/settings/HelpSection";

type Tab = "profile" | "preferences" | "notifications" | "help";

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: "profile", icon: "◉", label: "Profile" },
  { id: "preferences", icon: "🎨", label: "Preferences" },
  { id: "notifications", icon: "🔔", label: "Notifications" },
  { id: "help", icon: "❓", label: "Help" },
];

const TAB_TITLES: Record<Tab, string> = {
  profile: "Profile",
  preferences: "Preferences",
  notifications: "Notifications",
  help: "Help",
};

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("profile");

  return (
    <div className="journal-layout">
      <div className="entry-list" style={{ width: 260 }}>
        <div className="entry-list-header">
          <Link
            href="/journal"
            className="nav-btn"
            style={{ display: "inline-flex", marginBottom: 14 }}
          >
            ← Journal
          </Link>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.1rem",
              fontStyle: "italic",
              color: "var(--text)",
            }}
          >
            ⚙ Settings
          </div>
        </div>
        <div className="nav-section">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`nav-item${tab === t.id ? " active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              <span className="icon">{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="editor-pane">
        <div style={{ padding: "16px 32px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.15rem",
              fontStyle: "italic",
              color: "var(--text)",
            }}
          >
            {TAB_TITLES[tab]}
          </div>
        </div>
        <div className="editor-body">
          <div style={{ maxWidth: 680, display: "flex", flexDirection: "column", gap: 16 }}>
            {tab === "profile" && (
              <>
                <ProfileSection />
                <PasswordSection />
                <DangerZoneSection />
              </>
            )}
            {tab === "preferences" && <AppearanceSection />}
            {tab === "notifications" && <NotificationsSection />}
            {tab === "help" && <HelpSection />}
          </div>
        </div>
      </div>
    </div>
  );
}
