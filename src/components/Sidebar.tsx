"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { PromptModal } from "@/components/modals/PromptModal";
import { OwnedThemesModal } from "@/components/modals/OwnedThemesModal";
import { useJournal } from "@/lib/journal/journal-context";
import { usePlanner } from "@/lib/planner/planner-context";
import { THEMES, useTheme, type ThemeId } from "@/lib/theme/theme-context";
import { PaidSwatches } from "@/components/PaidSwatches";
import { useToast } from "@/lib/toast/toast-context";
import { SettingsIcon, type SettingsIconName } from "@/components/settings/SettingsIcon";
import { useCollapsed } from "@/lib/useCollapsed";
import { usePanelLayout } from "@/lib/usePanelLayout";
import { PanelResizer, usePanelDock } from "@/components/SidePanel";

const NAV_ITEMS: {
  view: string;
  href: string;
  icon: SettingsIconName;
  label: string;
  aiNav?: boolean;
}[] = [
  { view: "journal", href: "/journal", icon: "bookOpen", label: "Journal" },
  { view: "planner", href: "/planner", icon: "layoutDashboard", label: "Day Planner" },
  { view: "ai", href: "/ai", icon: "sparkles", label: "AI Planner", aiNav: true },
  { view: "budget", href: "/budget", icon: "wallet", label: "Budget" },
];

const SIDEBAR_BOUNDS = { defaultWidth: 265, minWidth: 220, maxWidth: 420 };

const MOODS: { icon: SettingsIconName; title: string }[] = [
  { icon: "moodAwful", title: "Awful" },
  { icon: "moodMeh", title: "Meh" },
  { icon: "moodOkay", title: "Okay" },
  { icon: "moodGood", title: "Good" },
  { icon: "moodGreat", title: "Great" },
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

  const [collapsed, toggleCollapsed, setCollapsed] = useCollapsed("soyuco_sidebar_collapsed");
  const panel = usePanelLayout("soyuco_sidebar_layout", "left", SIDEBAR_BOUNDS);
  const dock = usePanelDock("sidebar", panel.side, panel.setSide);
  const [newCollectionOpen, setNewCollectionOpen] = useState(false);
  const [ownedThemesOpen, setOwnedThemesOpen] = useState(false);
  const [deleteCollectionId, setDeleteCollectionId] = useState<number | null>(null);

  function goToJournal() {
    if (pathname !== "/journal") router.push("/journal");
  }

  return (
    <>
      <aside
        id="sidebar"
        data-panel
        className={`side-${panel.side}${collapsed ? " collapsed" : ""}${dock.docking ? " is-docking" : ""}`}
        style={collapsed ? undefined : { width: panel.width }}
      >
        <div className="sidebar-header" onPointerDown={dock.onPointerDown}>
          {dock.grip}
          <div className="logo-row">
            <div className="logo-img-slot">
              <img src="/logo.svg" alt="Soyuco Logo" draggable={false} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
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
              <span className="icon">
                <SettingsIcon name={item.icon} size={16} />
              </span> <span className="nav-text">{item.label}</span>
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
                    <span className="icon">
                      <SettingsIcon name="folder" size={14} />
                    </span>{" "}
                    {c.name}
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
                      aria-label={`Delete collection ${c.name}`}
                    >
                      <SettingsIcon name="close" size={11} />
                    </button>
                  </span>
                </div>
              );
            })}
            <button className="nav-item" onClick={() => setNewCollectionOpen(true)}>
              <span className="icon">
                <SettingsIcon name="plus" size={14} />
              </span>{" "}
              New Collection
            </button>
          </div>
        </div>

        <div className="mood-bar">
          <div className="mood-label">Today&apos;s mood</div>
          <div className="mood-emojis">
            {MOODS.map((mood, i) => (
              <span
                key={mood.title}
                className={`mood-emoji${todayMood === i + 1 ? " selected" : ""}`}
                title={mood.title}
                onClick={async () => {
                  await setMood(i + 1);
                  showToast(`Mood saved: ${mood.title}`, "success");
                }}
              >
                <SettingsIcon name={mood.icon} size={20} />
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
            <PaidSwatches group="regular" />
          </div>

          <div className="premium-label">
            <span className="premium-crown">
              <SettingsIcon name="crown" size={13} />
            </span>
            Premium
            <span className="premium-badge">PRO</span>
            <Link
              href="/marketplace"
              className={`sidebar-icon-btn${pathname === "/marketplace" ? " active" : ""}`}
              aria-current={pathname === "/marketplace" ? "page" : undefined}
              aria-label="Marketplace"
              title="Marketplace"
            >
              <SettingsIcon name="shoppingBag" size={14} />
            </Link>
          </div>
          <div className="theme-swatches">
            <PaidSwatches group="pro" />
          </div>

          <button
            className="custom-theme-btn"
            onClick={() => showToast("Theme customization is coming soon.", "info")}
          >
            <SettingsIcon name="palette" size={14} /> Customize Theme
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
      <PanelResizer
        label="sidebar"
        side={panel.side}
        width={panel.width}
        bounds={panel.bounds}
        collapsed={collapsed}
        collapsedWidth={64}
        onResize={panel.setWidth}
        onReset={panel.resetWidth}
        onCollapsedChange={setCollapsed}
      />
      {dock.preview}
    </>
  );
}
