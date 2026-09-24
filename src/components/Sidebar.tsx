"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { PromptModal } from "@/components/modals/PromptModal";
import { OwnedThemesModal } from "@/components/modals/OwnedThemesModal";
import { useJournal } from "@/lib/journal/journal-context";
import { usePlanner } from "@/lib/planner/planner-context";
import { PREMIUM_THEMES, THEMES, useTheme, type ThemeId } from "@/lib/theme/theme-context";
import { useToast } from "@/lib/toast/toast-context";
import { SettingsIcon } from "@/components/settings/SettingsIcon";
import { useCollapsed } from "@/lib/useCollapsed";

const NAV_ITEMS = [
  { view: "journal", href: "/journal", icon: "✦", label: "Journal" },
  { view: "planner", href: "/planner", icon: "◈", label: "Day Planner" },
  { view: "ai", href: "/ai", icon: "⬡", label: "AI Planner", aiNav: true },
  { view: "budget", href: "/budget", icon: "◎", label: "Budget" },
];

const MOOD_EMOJIS = [
  { emoji: "😔", title: "Awful" },
  { emoji: "😐", title: "Meh" },
  { emoji: "🙂", title: "Okay" },
  { emoji: "😊", title: "Good" },
  { emoji: "🤩", title: "Great" },
];

function useSidebarDate() {
  const [label, setLabel] = useState("");

  useEffect(() => {
    function update() {
      setLabel(
        new Date()
          .toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
          .toUpperCase(),
      );
    }
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, []);

  return label;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const dateLabel = useSidebarDate();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();
  const { moodHistory, setMood } = usePlanner();
  const todayMood = moodHistory[new Date().toDateString()] ?? null;
  const {
    entries,
    collections,
    activeCollectionId,
    selectCollection,
    createCollection,
    deleteCollection,
  } = useJournal();

  const [collapsed, toggleCollapsed] = useCollapsed("soyuco_sidebar_collapsed");
  const [newCollectionOpen, setNewCollectionOpen] = useState(false);
  const [ownedThemesOpen, setOwnedThemesOpen] = useState(false);
  const [deleteCollectionId, setDeleteCollectionId] = useState<number | null>(null);

  function goToJournal() {
    if (pathname !== "/journal") router.push("/journal");
  }

  return (
    <aside id="sidebar" className={collapsed ? "collapsed" : undefined}>
      <div className="sidebar-header">
        <div className="logo-row">
          <div className="logo-img-slot">
            <img src="/logo.svg" alt="Soyuco Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          <div className="logo">
            <span>Soyuco</span>
            <div className="logo-dot" />
          </div>
          <button
            type="button"
            className="panel-toggle"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <SettingsIcon name={collapsed ? "panelOpen" : "panelClose"} />
          </button>
        </div>
        <div className="date-display">{dateLabel}</div>
      </div>

      <div className="nav-section">
        <div className="nav-label">Pages</div>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.view}
            href={item.href}
            className={`nav-item${item.aiNav ? " ai-nav" : ""}${pathname === item.href ? " active" : ""}`}
            title={collapsed ? item.label : undefined}
          >
            <span className="icon">{item.icon}</span> <span className="nav-text">{item.label}</span>
            {item.view === "journal" && <span className="count">{entries.length}</span>}
          </Link>
        ))}

        <div className="sidebar-collections">
          <div className="nav-label" style={{ marginTop: 12 }}>
            Collections
          </div>
          {collections.map((c) => {
            const count = entries.filter((e) => e.collections.includes(c.id)).length;
            return (
              <div
                key={c.id}
                className={`nav-item${activeCollectionId === c.id ? " active" : ""}`}
                style={{ justifyContent: "space-between" }}
                onClick={() => {
                  selectCollection(c.id);
                  goToJournal();
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="icon">◇</span> {c.name}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span className="count">{count}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteCollectionId(c.id);
                    }}
                    style={{
                      fontSize: "0.6rem",
                      color: "var(--text3)",
                      padding: "1px 4px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      lineHeight: 1,
                    }}
                  >
                    ✕
                  </button>
                </span>
              </div>
            );
          })}
          <button className="nav-item" onClick={() => setNewCollectionOpen(true)}>
            <span className="icon">+</span> New Collection
          </button>
        </div>
      </div>

      <div className="mood-bar">
        <div className="mood-label">Today&apos;s mood</div>
        <div className="mood-emojis">
          {MOOD_EMOJIS.map((mood, i) => (
            <span
              key={mood.emoji}
              className={`mood-emoji${todayMood === i + 1 ? " selected" : ""}`}
              title={mood.title}
              onClick={async () => {
                await setMood(i + 1);
                showToast(`Mood saved: ${mood.title}`, "success");
              }}
            >
              {mood.emoji}
            </span>
          ))}
        </div>
      </div>

      <div className="theme-section">
        <div className="theme-label-row">
          <div className="theme-label">Theme</div>
          <button
            type="button"
            className="sidebar-icon-btn"
            onClick={() => setOwnedThemesOpen(true)}
            aria-label="Show all owned themes"
            title="Show all owned themes"
          >
            <SettingsIcon name="moreHorizontal" size={16} />
          </button>
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

        <div className="premium-label">
          <span className="premium-crown">
            <SettingsIcon name="crown" size={13} />
          </span>
          Premium
          <span className="premium-badge">PRO</span>
          <Link href="/marketplace" className="sidebar-icon-btn" aria-label="Marketplace" title="Marketplace">
            <SettingsIcon name="shoppingBag" size={14} />
          </Link>
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
          ✦ Customize Theme
        </button>
      </div>

      <OwnedThemesModal open={ownedThemesOpen} onClose={() => setOwnedThemesOpen(false)} />
      <PromptModal
        open={newCollectionOpen}
        title="New Collection"
        label="Collection Name"
        placeholder="e.g. Gratitude, Dreams, Work…"
        confirmLabel="Create"
        onCancel={() => setNewCollectionOpen(false)}
        onConfirm={(value) => {
          createCollection(value);
          setNewCollectionOpen(false);
          goToJournal();
        }}
      />
      <ConfirmModal
        open={deleteCollectionId !== null}
        title="Delete Collection?"
        message="The collection will be removed. Your journal entries will not be deleted."
        onCancel={() => setDeleteCollectionId(null)}
        onConfirm={() => {
          if (deleteCollectionId !== null) deleteCollection(deleteCollectionId);
          setDeleteCollectionId(null);
        }}
      />
    </aside>
  );
}
