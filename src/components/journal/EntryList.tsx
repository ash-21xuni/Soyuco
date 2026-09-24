"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useJournal } from "@/lib/journal/journal-context";
import { SettingsIcon } from "@/components/settings/SettingsIcon";
import { useCollapsed } from "@/lib/useCollapsed";
import { bodyToText } from "@/lib/journal/body";

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function EntryList() {
  const { entries, activeCollectionId, currentEntryId, selectEntry } = useJournal();
  const [search, setSearch] = useState("");
  const [collapsed, toggleCollapsed, setCollapsed] = useCollapsed("soyuco_entrylist_collapsed");
  const focusSearchOnOpen = useRef(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Opening via the rail's search button drops the cursor straight into search.
  useEffect(() => {
    if (!collapsed && focusSearchOnOpen.current) {
      focusSearchOnOpen.current = false;
      searchRef.current?.focus();
    }
  }, [collapsed]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = entries.filter(
      (e) => e.title.toLowerCase().includes(q) || bodyToText(e.body).toLowerCase().includes(q),
    );
    if (activeCollectionId !== null) {
      list = list.filter((e) => e.collections.includes(activeCollectionId));
    }
    return list.slice().sort((a, b) => b.date - a.date);
  }, [entries, search, activeCollectionId]);

  if (collapsed) {
    return (
      <div className="entry-list collapsed">
        <button
          type="button"
          className="panel-toggle"
          onClick={toggleCollapsed}
          aria-label="Expand entries"
          aria-expanded={false}
          title="Expand entries"
        >
          <SettingsIcon name="panelOpen" />
        </button>
        <button
          type="button"
          className="panel-toggle"
          onClick={() => {
            focusSearchOnOpen.current = true;
            setCollapsed(false);
          }}
          aria-label="Search entries"
          title="Search entries"
        >
          <SettingsIcon name="search" />
        </button>
        <span className="entry-list-rail-count" title={`${filtered.length} entries`}>
          {filtered.length}
        </span>
      </div>
    );
  }

  return (
    <div className="entry-list">
      <div className="entry-list-header">
        <div className="entry-search-row">
          <input
            ref={searchRef}
            className="entry-search"
            type="text"
            placeholder="Search entries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            type="button"
            className="panel-toggle"
            onClick={toggleCollapsed}
            aria-label="Collapse entries"
            aria-expanded
            title="Collapse entries"
          >
            <SettingsIcon name="panelClose" />
          </button>
        </div>
      </div>
      <div>
        {filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: "32px 16px" }}>
            <div className="empty-sub">
              No entries yet.
              <br />
              Create your first one!
            </div>
          </div>
        ) : (
          filtered.map((e) => (
            <div
              key={e.id}
              className={`entry-card${e.id === currentEntryId ? " active" : ""}`}
              onClick={() => selectEntry(e.id)}
            >
              <div className="entry-card-date">{formatDate(e.date)}</div>
              <div className="entry-card-title">{e.title || "Untitled"}</div>
              <div className="entry-card-preview">
                {bodyToText(e.body) ? bodyToText(e.body).substring(0, 120) : <em>No content</em>}
              </div>
              <div className="entry-card-tags">
                {e.tags.map((t) => (
                  <span key={t} className="tag accent">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
